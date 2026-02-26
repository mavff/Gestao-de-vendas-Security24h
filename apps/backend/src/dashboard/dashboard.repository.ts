import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export type PeriodKey = '7d' | '30d' | '90d' | 'all';

const MES_NOMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const EMPRESA_IDS = [2, 1002];

@Injectable()
export class DashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getDateFrom(period: PeriodKey): Date | null {
    const daysMap: Record<PeriodKey, number | null> = { '7d': 7, '30d': 30, '90d': 90, all: null };
    const days = daysMap[period];
    return days ? new Date(Date.now() - days * 86_400_000) : null;
  }

  async getStats(period: PeriodKey) {
    this.prisma.ensureConnection();
    const dateFrom = this.getDateFrom(period);
    const weekAgo = new Date(Date.now() - 7 * 86_400_000);

    const orcWhere: Record<string, any> = { status: { not: 'C' }, empresa: { in: EMPRESA_IDS } };
    if (dateFrom) orcWhere.emissao = { gte: dateFrom };

    const closuresWhere: Record<string, any> = { fechamento: { not: null }, usuario: { not: null }, empresa: { in: EMPRESA_IDS } };
    if (dateFrom) closuresWhere.fechamento = { gte: dateFrom };

    const prospectWhere: Record<string, any> = { OR: [{ inativo: false }, { inativo: null }] };
    if (dateFrom) prospectWhere.dataCadastro = { gte: dateFrom };

    // Batch 1: parallelizable queries
    const [funnel, bySeller, byOriginRaw, totalLeads, kpiConverted, kpiRevenue, kpiNewWeek, leadsByPeriod] =
      await Promise.all([
        // 1. Funil por etapa (orçamentos não cancelados)
        this.prisma.orcamento.groupBy({
          by: ['etapa'],
          where: { ...orcWhere, etapa: { not: null } },
          _count: { codInterno: true },
          orderBy: { _count: { codInterno: 'desc' } },
        }),

        // 2. Fechamentos por usuário/vendedor
        this.prisma.orcamento.groupBy({
          by: ['usuario'],
          where: closuresWhere,
          _count: { codInterno: true },
          orderBy: { _count: { codInterno: 'desc' } },
          take: 10,
        }),

        // 3. Leads por origem (códigos brutos)
        this.prisma.prospect.groupBy({
          by: ['origem'],
          where: { ...prospectWhere, origem: { not: null } },
          _count: { codProspect: true },
          orderBy: { _count: { codProspect: 'desc' } },
          take: 8,
        }),

        // 4. KPI: total de leads ativos no período
        this.prisma.prospect.count({ where: prospectWhere }),

        // 5. KPI: leads convertidos (virou cliente)
        this.prisma.prospect.count({
          where: {
            status: 'X',
            ...(dateFrom ? { dataCadastro: { gte: dateFrom } } : {}),
          },
        }),

        // 6. KPI: receita estimada (soma dos orçamentos não cancelados)
        this.prisma.orcamento.aggregate({
          where: orcWhere,
          _sum: { totalProdutos: true, totalServicos: true },
        }),

        // 7. KPI: novos leads esta semana (fixo — sempre 7d)
        this.prisma.prospect.count({
          where: { dataCadastro: { gte: weekAgo }, OR: [{ inativo: false }, { inativo: null }] },
        }),

        // 8. Leads por período (agrupamento por data)
        this.getLeadsByPeriod(period, dateFrom),
      ]);

    // Batch 2: buscar labels de origem com base nos códigos encontrados
    const originCodes = byOriginRaw.filter((o) => o.origem != null).map((o) => o.origem as number);
    const originLabels =
      originCodes.length > 0
        ? await this.prisma.dadoEntidade.findMany({
            where: { codInterno: { in: originCodes } },
            select: { codInterno: true, descreve: true },
          })
        : [];

    // --- Montar resposta ---

    const funnelData = funnel
      .filter((f) => f.etapa)
      .map((f) => ({ stage: f.etapa as string, total: f._count.codInterno }));

    const closuresBySeller = bySeller
      .filter((s) => s.usuario)
      .map((s) => ({ seller: (s.usuario as string).trim(), closures: s._count.codInterno }));

    const originMap = new Map(originLabels.map((o) => [o.codInterno, o.descreve]));
    const leadsByOrigin = byOriginRaw
      .filter((o) => o.origem != null)
      .map((o) => ({
        origin: originMap.get(o.origem as number) ?? `Código ${o.origem}`,
        total: o._count.codProspect,
      }));

    const conversionRate =
      totalLeads > 0 ? Math.round((kpiConverted / totalLeads) * 1000) / 10 : 0;

    const revenue =
      Number(kpiRevenue._sum.totalProdutos ?? 0) + Number(kpiRevenue._sum.totalServicos ?? 0);

    return {
      funnelData,
      leadsByWeek: leadsByPeriod,
      closuresBySeller,
      leadsByOrigin,
      kpis: {
        totalLeads,
        conversionRate,
        estimatedRevenue: Math.round(revenue),
        newLeadsThisWeek: kpiNewWeek,
      },
    };
  }

  async getFinanceiro(dataInicio?: string, dataFim?: string) {
    this.prisma.ensureConnection();

    function buildPeriodFilter(field: 'emissao' | 'dataAbertura') {
      if (!dataInicio && !dataFim) return {};
      return {
        [field]: {
          ...(dataInicio ? { gte: new Date(dataInicio + 'T00:00:00.000Z') } : {}),
          ...(dataFim ? { lte: new Date(dataFim + 'T23:59:59.999Z') } : {}),
        },
      };
    }

    const orcPeriodo = buildPeriodFilter('emissao');
    const osPeriodo = buildPeriodFilter('dataAbertura');
    const baseOrc = { empresa: { in: EMPRESA_IDS } };
    const baseOs = { empresa: { in: EMPRESA_IDS } };

    const [
      receitaAgg,
      mrrAgg,
      pipelineAgg,
      osInstalacoes,
      osManutencoes,
      porVendedorRaw,
      fechadosList,
    ] = await Promise.all([
      // 1. Receita fechada no período
      this.prisma.orcamento.aggregate({
        where: { ...baseOrc, ...orcPeriodo, status: { in: ['L', 'E'] } },
        _sum: { totalProdutos: true, totalServicos: true },
        _count: { codInterno: true },
      }),
      // 2. MRR base ativa (sem filtro de período)
      this.prisma.orcamento.aggregate({
        where: { ...baseOrc, status: { not: 'C' } },
        _sum: { valorMonitoramento: true },
      }),
      // 3. Pipeline aberto no período
      this.prisma.orcamento.aggregate({
        where: { ...baseOrc, ...orcPeriodo, status: 'A' },
        _sum: { totalProdutos: true, totalServicos: true },
      }),
      // 4. OS Instalações no período
      this.prisma.ordemServico.count({
        where: { ...baseOs, ...osPeriodo, tipo: 'I' },
      }),
      // 5. OS Manutenções no período
      this.prisma.ordemServico.count({
        where: { ...baseOs, ...osPeriodo, tipo: 'M' },
      }),
      // 6. Por vendedor (fechados no período, top 10)
      this.prisma.orcamento.groupBy({
        by: ['usuario'],
        where: { ...baseOrc, ...orcPeriodo, status: { in: ['L', 'E'] }, usuario: { not: null } },
        _sum: { totalProdutos: true, totalServicos: true },
        orderBy: { _sum: { totalProdutos: 'desc' } },
        take: 10,
      }),
      // 7. Detalhes fechados para agregação mensal
      this.prisma.orcamento.findMany({
        where: { ...baseOrc, ...orcPeriodo, status: { in: ['L', 'E'] } },
        select: { emissao: true, totalProdutos: true, totalServicos: true },
      }),
    ]);

    // Aggregate by month
    const monthlyMap = new Map<string, { equipamentos: number; instalacao: number }>();
    for (const orc of fechadosList) {
      if (!orc.emissao) continue;
      const mesKey = orc.emissao.toISOString().slice(0, 7);
      const cur = monthlyMap.get(mesKey) ?? { equipamentos: 0, instalacao: 0 };
      cur.equipamentos += Number(orc.totalProdutos ?? 0);
      cur.instalacao += Number(orc.totalServicos ?? 0);
      monthlyMap.set(mesKey, cur);
    }

    const evolucaoMensal = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mesKey, vals]) => {
        const [ano, mesNum] = mesKey.split('-');
        const label = MES_NOMES[Number(mesNum) - 1] + '/' + ano.slice(2);
        return { mes: label, equipamentos: Math.round(vals.equipamentos), instalacao: Math.round(vals.instalacao) };
      });

    const receitaEquipamentos = Number(receitaAgg._sum.totalProdutos ?? 0);
    const receitaInstalacao = Number(receitaAgg._sum.totalServicos ?? 0);
    const receitaTotal = receitaEquipamentos + receitaInstalacao;
    const orcamentosFechados = receitaAgg._count.codInterno;
    const ticketMedio = orcamentosFechados > 0 ? Math.round(receitaTotal / orcamentosFechados) : 0;
    const mrrBase = Number(mrrAgg._sum.valorMonitoramento ?? 0);
    const arr = Math.round(mrrBase * 12);
    const pipelineAberto = Number(pipelineAgg._sum.totalProdutos ?? 0) + Number(pipelineAgg._sum.totalServicos ?? 0);

    const porVendedor = porVendedorRaw
      .filter((v) => v.usuario)
      .map((v) => {
        const equipamentos = Number(v._sum.totalProdutos ?? 0);
        const instalacao = Number(v._sum.totalServicos ?? 0);
        return {
          usuario: (v.usuario as string).trim(),
          equipamentos: Math.round(equipamentos),
          instalacao: Math.round(instalacao),
          total: Math.round(equipamentos + instalacao),
        };
      });

    const mixReceita = [
      { name: 'Equipamentos', value: Math.round(receitaEquipamentos) },
      { name: 'Instalação', value: Math.round(receitaInstalacao) },
      { name: 'Monitoramento MRR', value: Math.round(mrrBase) },
    ].filter((item) => item.value > 0);

    return {
      receitaEquipamentos: Math.round(receitaEquipamentos),
      receitaInstalacao: Math.round(receitaInstalacao),
      receitaTotal: Math.round(receitaTotal),
      mrrBase: Math.round(mrrBase),
      arr,
      orcamentosFechados,
      ticketMedio,
      pipelineAberto: Math.round(pipelineAberto),
      osInstalacoes,
      osManutencoes,
      porVendedor,
      evolucaoMensal,
      mixReceita,
    };
  }

  private async getLeadsByPeriod(
    period: PeriodKey,
    dateFrom: Date | null,
  ): Promise<{ week: string; leads: number }[]> {
    if (period === '7d' && dateFrom) {
      // Agrupar por dia da semana (últimos 7 dias)
      const rows: any[] = await this.prisma.$queryRaw`
        SELECT DATENAME(weekday, DataCadastro) as dia, COUNT(*) as leads
        FROM Prospects
        WHERE DataCadastro >= ${dateFrom}
          AND (Inativo = 0 OR Inativo IS NULL)
        GROUP BY DATENAME(weekday, DataCadastro), DATEPART(weekday, DataCadastro)
        ORDER BY DATEPART(weekday, DataCadastro)
      `;
      const dayPt: Record<string, string> = {
        Sunday: 'Dom', Monday: 'Seg', Tuesday: 'Ter',
        Wednesday: 'Qua', Thursday: 'Qui', Friday: 'Sex', Saturday: 'Sáb',
      };
      return rows.map((r) => ({ week: dayPt[r.dia] ?? r.dia, leads: Number(r.leads) }));
    }

    if (period === '30d' && dateFrom) {
      // Agrupar por semana do mês (últimos 30 dias)
      const rows: any[] = await this.prisma.$queryRaw`
        SELECT DATEPART(week, DataCadastro) as semana, COUNT(*) as leads
        FROM Prospects
        WHERE DataCadastro >= ${dateFrom}
          AND (Inativo = 0 OR Inativo IS NULL)
        GROUP BY DATEPART(week, DataCadastro)
        ORDER BY semana
      `;
      return rows.map((r, i) => ({ week: `Sem ${i + 1}`, leads: Number(r.leads) }));
    }

    // 90d ou all — agrupar por mês (últimos 12 meses no máximo)
    const monthFrom = period === '90d' && dateFrom ? dateFrom : new Date(Date.now() - 365 * 86_400_000);
    const rows: any[] = await this.prisma.$queryRaw`
      SELECT YEAR(DataCadastro) as ano, MONTH(DataCadastro) as mes, COUNT(*) as leads
      FROM Prospects
      WHERE DataCadastro >= ${monthFrom}
        AND (Inativo = 0 OR Inativo IS NULL)
      GROUP BY YEAR(DataCadastro), MONTH(DataCadastro)
      ORDER BY ano, mes
    `;
    return rows.map((r) => ({
      week: MES_NOMES[Number(r.mes) - 1],
      leads: Number(r.leads),
    }));
  }
}
