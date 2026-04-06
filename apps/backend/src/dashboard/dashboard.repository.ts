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
      evolucaoMensal,
      porTecnicoRaw,
      comissaoDescontoAgg,
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
      // 7. Evolução mensal via SQL GROUP BY (não transfere todos os registros — eficiente para ranges amplos)
      this.buildMonthlyEvolution(dataInicio, dataFim),
      // 8. Performance por técnico (OS fechadas + receita do orçamento vinculado)
      this.buildTecnicoPerformance(dataInicio, dataFim),
      // 9. Comissões e descontos dos orçamentos fechados no período
      this.prisma.orcamento.aggregate({
        where: { ...baseOrc, ...orcPeriodo, status: { in: ['L', 'E'] } },
        _sum: { comissao: true, desconto: true },
      }),
    ]);

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

    const porTecnico = (porTecnicoRaw as any[]).map((r) => ({
      tecnico: String(r.tecnico ?? 'Não identificado').trim(),
      osInstalacoes: Number(r.osInstalacoes ?? 0),
      osManutencoes: Number(r.osManutencoes ?? 0),
      receitaEquipamentos: Math.round(Number(r.receitaEquipamentos ?? 0)),
      receitaInstalacao: Math.round(Number(r.receitaInstalacao ?? 0)),
      receitaTotal: Math.round(Number(r.receitaEquipamentos ?? 0) + Number(r.receitaInstalacao ?? 0)),
    }));

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
      porTecnico,
      totalComissao: Math.round(Number(comissaoDescontoAgg._sum.comissao ?? 0)),
      totalDesconto: Math.round(Number(comissaoDescontoAgg._sum.desconto ?? 0)),
    };
  }

  /**
   * Performance por técnico: conta OS (instalações + manutenções) fechadas no período
   * e soma a receita dos orçamentos vinculados às instalações.
   * Join: OSs → Senhas (nome) → Orçamentos (receita).
   */
  private async buildTecnicoPerformance(dataInicio?: string, dataFim?: string) {
    type TecnicoRow = {
      tecnico: string;
      osInstalacoes: number;
      osManutencoes: number;
      receitaEquipamentos: number;
      receitaInstalacao: number;
    };

    if (dataInicio && dataFim) {
      const di = new Date(dataInicio + 'T00:00:00.000Z');
      const df = new Date(dataFim + 'T23:59:59.999Z');
      return this.prisma.$queryRaw<TecnicoRow[]>`
        SELECT
          COALESCE(NULLIF(LTRIM(RTRIM(s.[Identificação])), ''), LTRIM(RTRIM(s.[Usuário])),
                   'Técnico ' + CAST(os.[Técnico] AS VARCHAR(20))) AS tecnico,
          SUM(CASE WHEN os.[Tipo] = 'I' THEN 1 ELSE 0 END) AS osInstalacoes,
          SUM(CASE WHEN os.[Tipo] = 'M' THEN 1 ELSE 0 END) AS osManutencoes,
          SUM(CASE WHEN os.[Tipo] = 'I' THEN CAST(ISNULL(orc.[TotalProdutos], 0) AS FLOAT) ELSE 0 END) AS receitaEquipamentos,
          SUM(CASE WHEN os.[Tipo] = 'I' THEN CAST(ISNULL(orc.[TotalServiços], 0) AS FLOAT) ELSE 0 END) AS receitaInstalacao
        FROM [OSs] os
        LEFT JOIN [Senhas] s ON s.[IDUsuário] = os.[Técnico]
        LEFT JOIN [Orçamentos] orc ON orc.[CodInterno] = os.[Orçamento] AND orc.[Empresa] IN (2, 1002)
        WHERE os.[Empresa] IN (2, 1002)
          AND os.[Técnico] IS NOT NULL
          AND os.[DataFechamento] IS NOT NULL
          AND os.[DataFechamento] >= ${di}
          AND os.[DataFechamento] <= ${df}
        GROUP BY
          COALESCE(NULLIF(LTRIM(RTRIM(s.[Identificação])), ''), LTRIM(RTRIM(s.[Usuário])),
                   'Técnico ' + CAST(os.[Técnico] AS VARCHAR(20))),
          os.[Técnico]
        ORDER BY
          SUM(CASE WHEN os.[Tipo] = 'I' THEN CAST(ISNULL(orc.[TotalProdutos], 0) AS FLOAT)
                                              + CAST(ISNULL(orc.[TotalServiços], 0) AS FLOAT) ELSE 0 END) DESC`;
    } else if (dataInicio) {
      const di = new Date(dataInicio + 'T00:00:00.000Z');
      return this.prisma.$queryRaw<TecnicoRow[]>`
        SELECT
          COALESCE(NULLIF(LTRIM(RTRIM(s.[Identificação])), ''), LTRIM(RTRIM(s.[Usuário])),
                   'Técnico ' + CAST(os.[Técnico] AS VARCHAR(20))) AS tecnico,
          SUM(CASE WHEN os.[Tipo] = 'I' THEN 1 ELSE 0 END) AS osInstalacoes,
          SUM(CASE WHEN os.[Tipo] = 'M' THEN 1 ELSE 0 END) AS osManutencoes,
          SUM(CASE WHEN os.[Tipo] = 'I' THEN CAST(ISNULL(orc.[TotalProdutos], 0) AS FLOAT) ELSE 0 END) AS receitaEquipamentos,
          SUM(CASE WHEN os.[Tipo] = 'I' THEN CAST(ISNULL(orc.[TotalServiços], 0) AS FLOAT) ELSE 0 END) AS receitaInstalacao
        FROM [OSs] os
        LEFT JOIN [Senhas] s ON s.[IDUsuário] = os.[Técnico]
        LEFT JOIN [Orçamentos] orc ON orc.[CodInterno] = os.[Orçamento] AND orc.[Empresa] IN (2, 1002)
        WHERE os.[Empresa] IN (2, 1002)
          AND os.[Técnico] IS NOT NULL
          AND os.[DataFechamento] IS NOT NULL
          AND os.[DataFechamento] >= ${di}
        GROUP BY
          COALESCE(NULLIF(LTRIM(RTRIM(s.[Identificação])), ''), LTRIM(RTRIM(s.[Usuário])),
                   'Técnico ' + CAST(os.[Técnico] AS VARCHAR(20))),
          os.[Técnico]
        ORDER BY
          SUM(CASE WHEN os.[Tipo] = 'I' THEN CAST(ISNULL(orc.[TotalProdutos], 0) AS FLOAT)
                                              + CAST(ISNULL(orc.[TotalServiços], 0) AS FLOAT) ELSE 0 END) DESC`;
    } else if (dataFim) {
      const df = new Date(dataFim + 'T23:59:59.999Z');
      return this.prisma.$queryRaw<TecnicoRow[]>`
        SELECT
          COALESCE(NULLIF(LTRIM(RTRIM(s.[Identificação])), ''), LTRIM(RTRIM(s.[Usuário])),
                   'Técnico ' + CAST(os.[Técnico] AS VARCHAR(20))) AS tecnico,
          SUM(CASE WHEN os.[Tipo] = 'I' THEN 1 ELSE 0 END) AS osInstalacoes,
          SUM(CASE WHEN os.[Tipo] = 'M' THEN 1 ELSE 0 END) AS osManutencoes,
          SUM(CASE WHEN os.[Tipo] = 'I' THEN CAST(ISNULL(orc.[TotalProdutos], 0) AS FLOAT) ELSE 0 END) AS receitaEquipamentos,
          SUM(CASE WHEN os.[Tipo] = 'I' THEN CAST(ISNULL(orc.[TotalServiços], 0) AS FLOAT) ELSE 0 END) AS receitaInstalacao
        FROM [OSs] os
        LEFT JOIN [Senhas] s ON s.[IDUsuário] = os.[Técnico]
        LEFT JOIN [Orçamentos] orc ON orc.[CodInterno] = os.[Orçamento] AND orc.[Empresa] IN (2, 1002)
        WHERE os.[Empresa] IN (2, 1002)
          AND os.[Técnico] IS NOT NULL
          AND os.[DataFechamento] IS NOT NULL
          AND os.[DataFechamento] <= ${df}
        GROUP BY
          COALESCE(NULLIF(LTRIM(RTRIM(s.[Identificação])), ''), LTRIM(RTRIM(s.[Usuário])),
                   'Técnico ' + CAST(os.[Técnico] AS VARCHAR(20))),
          os.[Técnico]
        ORDER BY
          SUM(CASE WHEN os.[Tipo] = 'I' THEN CAST(ISNULL(orc.[TotalProdutos], 0) AS FLOAT)
                                              + CAST(ISNULL(orc.[TotalServiços], 0) AS FLOAT) ELSE 0 END) DESC`;
    } else {
      return this.prisma.$queryRaw<TecnicoRow[]>`
        SELECT
          COALESCE(NULLIF(LTRIM(RTRIM(s.[Identificação])), ''), LTRIM(RTRIM(s.[Usuário])),
                   'Técnico ' + CAST(os.[Técnico] AS VARCHAR(20))) AS tecnico,
          SUM(CASE WHEN os.[Tipo] = 'I' THEN 1 ELSE 0 END) AS osInstalacoes,
          SUM(CASE WHEN os.[Tipo] = 'M' THEN 1 ELSE 0 END) AS osManutencoes,
          SUM(CASE WHEN os.[Tipo] = 'I' THEN CAST(ISNULL(orc.[TotalProdutos], 0) AS FLOAT) ELSE 0 END) AS receitaEquipamentos,
          SUM(CASE WHEN os.[Tipo] = 'I' THEN CAST(ISNULL(orc.[TotalServiços], 0) AS FLOAT) ELSE 0 END) AS receitaInstalacao
        FROM [OSs] os
        LEFT JOIN [Senhas] s ON s.[IDUsuário] = os.[Técnico]
        LEFT JOIN [Orçamentos] orc ON orc.[CodInterno] = os.[Orçamento] AND orc.[Empresa] IN (2, 1002)
        WHERE os.[Empresa] IN (2, 1002)
          AND os.[Técnico] IS NOT NULL
          AND os.[DataFechamento] IS NOT NULL
        GROUP BY
          COALESCE(NULLIF(LTRIM(RTRIM(s.[Identificação])), ''), LTRIM(RTRIM(s.[Usuário])),
                   'Técnico ' + CAST(os.[Técnico] AS VARCHAR(20))),
          os.[Técnico]
        ORDER BY
          SUM(CASE WHEN os.[Tipo] = 'I' THEN CAST(ISNULL(orc.[TotalProdutos], 0) AS FLOAT)
                                              + CAST(ISNULL(orc.[TotalServiços], 0) AS FLOAT) ELSE 0 END) DESC`;
    }
  }

  /**
   * Agrega receita fechada por mês usando GROUP BY no SQL Server.
   * Evita buscar todos os registros individualmente (sem TAKE) em ranges amplos.
   */
  private async buildMonthlyEvolution(
    dataInicio?: string,
    dataFim?: string,
  ): Promise<{ mes: string; equipamentos: number; instalacao: number }[]> {
    type MonthRow = { ano: number; mes: number; equipamentos: number; instalacao: number };
    let rows: MonthRow[];

    if (dataInicio && dataFim) {
      const di = new Date(dataInicio + 'T00:00:00.000Z');
      const df = new Date(dataFim + 'T23:59:59.999Z');
      rows = await this.prisma.$queryRaw<MonthRow[]>`
        SELECT YEAR([Emissão]) as ano, MONTH([Emissão]) as mes,
               SUM(CAST(ISNULL([TotalProdutos], 0) AS FLOAT)) as equipamentos,
               SUM(CAST(ISNULL([TotalServiços], 0) AS FLOAT)) as instalacao
        FROM [Orçamentos]
        WHERE [Empresa] IN (2, 1002)
          AND [Status] IN ('L', 'E')
          AND [Emissão] IS NOT NULL
          AND [Emissão] >= ${di}
          AND [Emissão] <= ${df}
        GROUP BY YEAR([Emissão]), MONTH([Emissão])
        ORDER BY YEAR([Emissão]), MONTH([Emissão])`;
    } else if (dataInicio) {
      const di = new Date(dataInicio + 'T00:00:00.000Z');
      rows = await this.prisma.$queryRaw<MonthRow[]>`
        SELECT YEAR([Emissão]) as ano, MONTH([Emissão]) as mes,
               SUM(CAST(ISNULL([TotalProdutos], 0) AS FLOAT)) as equipamentos,
               SUM(CAST(ISNULL([TotalServiços], 0) AS FLOAT)) as instalacao
        FROM [Orçamentos]
        WHERE [Empresa] IN (2, 1002)
          AND [Status] IN ('L', 'E')
          AND [Emissão] IS NOT NULL
          AND [Emissão] >= ${di}
        GROUP BY YEAR([Emissão]), MONTH([Emissão])
        ORDER BY YEAR([Emissão]), MONTH([Emissão])`;
    } else if (dataFim) {
      const df = new Date(dataFim + 'T23:59:59.999Z');
      rows = await this.prisma.$queryRaw<MonthRow[]>`
        SELECT YEAR([Emissão]) as ano, MONTH([Emissão]) as mes,
               SUM(CAST(ISNULL([TotalProdutos], 0) AS FLOAT)) as equipamentos,
               SUM(CAST(ISNULL([TotalServiços], 0) AS FLOAT)) as instalacao
        FROM [Orçamentos]
        WHERE [Empresa] IN (2, 1002)
          AND [Status] IN ('L', 'E')
          AND [Emissão] IS NOT NULL
          AND [Emissão] <= ${df}
        GROUP BY YEAR([Emissão]), MONTH([Emissão])
        ORDER BY YEAR([Emissão]), MONTH([Emissão])`;
    } else {
      rows = await this.prisma.$queryRaw<MonthRow[]>`
        SELECT YEAR([Emissão]) as ano, MONTH([Emissão]) as mes,
               SUM(CAST(ISNULL([TotalProdutos], 0) AS FLOAT)) as equipamentos,
               SUM(CAST(ISNULL([TotalServiços], 0) AS FLOAT)) as instalacao
        FROM [Orçamentos]
        WHERE [Empresa] IN (2, 1002)
          AND [Status] IN ('L', 'E')
          AND [Emissão] IS NOT NULL
        GROUP BY YEAR([Emissão]), MONTH([Emissão])
        ORDER BY YEAR([Emissão]), MONTH([Emissão])`;
    }

    return rows.map((r) => {
      const label = MES_NOMES[Number(r.mes) - 1] + '/' + String(r.ano).slice(2);
      return {
        mes: label,
        equipamentos: Math.round(Number(r.equipamentos)),
        instalacao: Math.round(Number(r.instalacao)),
      };
    });
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

  // ─── Retenção de Clientes (segmentado por modalidade) ────────

  private static readonly MOD_LABELS: Record<string, string> = {
    V: 'Venda', L: 'Monitoramento', R: 'Rastreamento', C: 'Monitoramento',
  };

  async getRetencao(dataInicio?: string, dataFim?: string) {
    this.prisma.ensureConnection();

    const di = dataInicio ? new Date(dataInicio + 'T00:00:00.000Z') : null;
    const df = dataFim ? new Date(dataFim + 'T23:59:59.999Z') : null;
    const doze = new Date(Date.now() - 365 * 86_400_000);
    const pDi = di ?? doze;
    const pDf = df ?? new Date();

    type ModCountRow = { modalidade: string | null; total: number; mrr: number };
    type ModCancelRow = { modalidade: string | null; total: number; mrr: number; tempoMedio: number };
    type MonthModRow = { ano: number; mes: number; modalidade: string | null; total: number };
    type FaixaModRow = { modalidade: string | null; faixa: string; total: number };
    type VendedorChurnRow = { vendedor: string; cancelados: number; mrrPerdido: number };

    const [
      ativosMod, novosMod, canceladosMod,
      novosEvol, cancelEvol,
      faixaMod, churnVendedor,
    ] = await Promise.all([
      // 1. Ativos por modalidade (snapshot, sem período)
      this.prisma.$queryRaw<ModCountRow[]>`
        SELECT ISNULL(c.[Modalidade], '') as modalidade, COUNT(*) as total,
               SUM(CAST(ISNULL(c.[ValorNF], 0) AS FLOAT)) as mrr
        FROM [Clientes] c
        WHERE c.[Cancelamento] IS NULL AND c.[ValorNF] > 0 AND c.[Empresa] IN (2, 1002)
        GROUP BY c.[Modalidade]`,

      // 2. Novos por modalidade no período
      this.prisma.$queryRaw<ModCountRow[]>`
        SELECT ISNULL(c.[Modalidade], '') as modalidade, COUNT(*) as total,
               SUM(CAST(ISNULL(c.[ValorNF], 0) AS FLOAT)) as mrr
        FROM [Clientes] c
        WHERE c.[DataCadastro] >= ${pDi} AND c.[DataCadastro] <= ${pDf} AND c.[Empresa] IN (2, 1002)
        GROUP BY c.[Modalidade]`,

      // 3. Cancelados por modalidade no período
      this.prisma.$queryRaw<ModCancelRow[]>`
        SELECT ISNULL(c.[Modalidade], '') as modalidade, COUNT(*) as total,
               SUM(CAST(ISNULL(c.[ValorNF], 0) AS FLOAT)) as mrr,
               AVG(DATEDIFF(month, c.[DataCadastro], c.[Cancelamento])) as tempoMedio
        FROM [Clientes] c
        WHERE c.[Cancelamento] >= ${pDi} AND c.[Cancelamento] <= ${pDf} AND c.[Empresa] IN (2, 1002)
        GROUP BY c.[Modalidade]`,

      // 4. Evolução mensal novos POR MODALIDADE (12 meses)
      this.prisma.$queryRaw<MonthModRow[]>`
        SELECT YEAR(c.[DataCadastro]) as ano, MONTH(c.[DataCadastro]) as mes,
               ISNULL(c.[Modalidade], '') as modalidade, COUNT(*) as total
        FROM [Clientes] c
        WHERE c.[DataCadastro] >= ${doze} AND c.[DataCadastro] IS NOT NULL AND c.[Empresa] IN (2, 1002)
        GROUP BY YEAR(c.[DataCadastro]), MONTH(c.[DataCadastro]), c.[Modalidade]`,

      // 5. Evolução mensal cancelados POR MODALIDADE (12 meses)
      this.prisma.$queryRaw<MonthModRow[]>`
        SELECT YEAR(c.[Cancelamento]) as ano, MONTH(c.[Cancelamento]) as mes,
               ISNULL(c.[Modalidade], '') as modalidade, COUNT(*) as total
        FROM [Clientes] c
        WHERE c.[Cancelamento] >= ${doze} AND c.[Cancelamento] IS NOT NULL AND c.[Empresa] IN (2, 1002)
        GROUP BY YEAR(c.[Cancelamento]), MONTH(c.[Cancelamento]), c.[Modalidade]`,

      // 6. Permanência por faixa POR MODALIDADE
      this.prisma.$queryRaw<FaixaModRow[]>`
        SELECT ISNULL(c.[Modalidade], '') as modalidade,
          CASE
            WHEN DATEDIFF(month, c.[DataCadastro], c.[Cancelamento]) < 6 THEN '0-6 meses'
            WHEN DATEDIFF(month, c.[DataCadastro], c.[Cancelamento]) < 12 THEN '6-12 meses'
            WHEN DATEDIFF(month, c.[DataCadastro], c.[Cancelamento]) < 24 THEN '1-2 anos'
            ELSE '2+ anos'
          END as faixa,
          COUNT(*) as total
        FROM [Clientes] c
        WHERE c.[Cancelamento] IS NOT NULL AND c.[DataCadastro] IS NOT NULL AND c.[Empresa] IN (2, 1002)
        GROUP BY c.[Modalidade],
          CASE
            WHEN DATEDIFF(month, c.[DataCadastro], c.[Cancelamento]) < 6 THEN '0-6 meses'
            WHEN DATEDIFF(month, c.[DataCadastro], c.[Cancelamento]) < 12 THEN '6-12 meses'
            WHEN DATEDIFF(month, c.[DataCadastro], c.[Cancelamento]) < 24 THEN '1-2 anos'
            ELSE '2+ anos'
          END`,

      // 7. Churn por vendedor
      this.prisma.$queryRaw<VendedorChurnRow[]>`
        SELECT COALESCE(NULLIF(LTRIM(RTRIM(s.[Identificação])), ''), LTRIM(RTRIM(s.[Usuário])), 'Sem vendedor') as vendedor,
               COUNT(*) as cancelados,
               SUM(CAST(ISNULL(c.[ValorNF], 0) AS FLOAT)) as mrrPerdido
        FROM [Clientes] c
        LEFT JOIN [Senhas] s ON s.[IDUsuário] = c.[Vendedor]
        WHERE c.[Cancelamento] >= ${pDi} AND c.[Cancelamento] <= ${pDf} AND c.[Empresa] IN (2, 1002)
        GROUP BY COALESCE(NULLIF(LTRIM(RTRIM(s.[Identificação])), ''), LTRIM(RTRIM(s.[Usuário])), 'Sem vendedor')
        ORDER BY COUNT(*) DESC`,
    ]);

    const modLabel = (m: string | null) => DashboardRepository.MOD_LABELS[m ?? ''] ?? (m || 'Não informado');
    const modCode = (m: string | null) => (m === 'C' ? 'L' : m) || '';

    // ── Agregar por modalidade ──
    const allMods = new Set<string>();
    for (const r of ativosMod) allMods.add(modCode(r.modalidade));
    for (const r of novosMod) allMods.add(modCode(r.modalidade));
    for (const r of canceladosMod) allMods.add(modCode(r.modalidade));

    const ativosMap = new Map<string, { total: number; mrr: number }>();
    for (const r of ativosMod) {
      const k = modCode(r.modalidade);
      const prev = ativosMap.get(k) ?? { total: 0, mrr: 0 };
      ativosMap.set(k, { total: prev.total + Number(r.total), mrr: prev.mrr + Number(r.mrr) });
    }
    const novosMap = new Map<string, { total: number; mrr: number }>();
    for (const r of novosMod) {
      const k = modCode(r.modalidade);
      const prev = novosMap.get(k) ?? { total: 0, mrr: 0 };
      novosMap.set(k, { total: prev.total + Number(r.total), mrr: prev.mrr + Number(r.mrr) });
    }
    const cancelMap = new Map<string, { total: number; mrr: number; tempoMedio: number }>();
    for (const r of canceladosMod) {
      const k = modCode(r.modalidade);
      const prev = cancelMap.get(k) ?? { total: 0, mrr: 0, tempoMedio: 0 };
      const newTotal = prev.total + Number(r.total);
      cancelMap.set(k, {
        total: newTotal,
        mrr: prev.mrr + Number(r.mrr),
        tempoMedio: newTotal > 0 ? Math.round((prev.tempoMedio * prev.total + Number(r.tempoMedio ?? 0) * Number(r.total)) / newTotal) : 0,
      });
    }

    const porModalidade = [...allMods].filter(Boolean).sort().map((codigo) => {
      const a = ativosMap.get(codigo) ?? { total: 0, mrr: 0 };
      const n = novosMap.get(codigo) ?? { total: 0, mrr: 0 };
      const c = cancelMap.get(codigo) ?? { total: 0, mrr: 0, tempoMedio: 0 };
      const base = a.total + c.total;
      return {
        modalidade: modLabel(codigo),
        codigo,
        ativos: a.total,
        mrrAtivos: Math.round(a.mrr),
        novos: n.total,
        mrrNovos: Math.round(n.mrr),
        cancelados: c.total,
        mrrPerdido: Math.round(c.mrr),
        tempoMedio: c.tempoMedio,
        churnRate: base > 0 ? Math.round((c.total / base) * 1000) / 10 : 0,
      };
    });

    // ── Totais gerais ──
    const totalAtivos = porModalidade.reduce((s, m) => s + m.ativos, 0);
    const mrrAtual = porModalidade.reduce((s, m) => s + m.mrrAtivos, 0);
    const novosNoPeriodo = porModalidade.reduce((s, m) => s + m.novos, 0);
    const canceladosNoPeriodo = porModalidade.reduce((s, m) => s + m.cancelados, 0);
    const mrrPerdido = porModalidade.reduce((s, m) => s + m.mrrPerdido, 0);
    const mrrNovos = porModalidade.reduce((s, m) => s + m.mrrNovos, 0);
    const baseInicio = totalAtivos + canceladosNoPeriodo;
    const taxaRetencao = baseInicio > 0 ? Math.round((totalAtivos / baseInicio) * 1000) / 10 : 100;
    const churnRate = baseInicio > 0 ? Math.round((canceladosNoPeriodo / baseInicio) * 1000) / 10 : 0;
    const tempoTotal = porModalidade.filter((m) => m.cancelados > 0);
    const tempoMedioPermanencia = tempoTotal.length > 0
      ? Math.round(tempoTotal.reduce((s, m) => s + m.tempoMedio * m.cancelados, 0) / tempoTotal.reduce((s, m) => s + m.cancelados, 0))
      : 0;

    // ── Evolução mensal com breakdown por modalidade ──
    type EvolKey = string; // "2025-03"
    const evolNovos = new Map<EvolKey, Map<string, number>>();
    const evolCancel = new Map<EvolKey, Map<string, number>>();
    for (const r of novosEvol) {
      const k = `${r.ano}-${String(Number(r.mes)).padStart(2, '0')}`;
      if (!evolNovos.has(k)) evolNovos.set(k, new Map());
      const mod = modLabel(modCode(r.modalidade));
      const m = evolNovos.get(k)!;
      m.set(mod, (m.get(mod) ?? 0) + Number(r.total));
    }
    for (const r of cancelEvol) {
      const k = `${r.ano}-${String(Number(r.mes)).padStart(2, '0')}`;
      if (!evolCancel.has(k)) evolCancel.set(k, new Map());
      const mod = modLabel(modCode(r.modalidade));
      const m = evolCancel.get(k)!;
      m.set(mod, (m.get(mod) ?? 0) + Number(r.total));
    }
    const allMonths = new Set([...evolNovos.keys(), ...evolCancel.keys()]);
    const modNames = [...new Set(porModalidade.map((m) => m.modalidade))];
    const evolucaoMensal = [...allMonths].sort().map((k) => {
      const [ano, mes] = k.split('-');
      const nMap = evolNovos.get(k) ?? new Map();
      const cMap = evolCancel.get(k) ?? new Map();
      const novos = [...nMap.values()].reduce((s, v) => s + v, 0);
      const cancelados = [...cMap.values()].reduce((s, v) => s + v, 0);
      return {
        mes: MES_NOMES[Number(mes) - 1] + '/' + ano.slice(2),
        novos,
        cancelados,
        saldo: novos - cancelados,
        porModalidade: modNames.map((mod) => ({
          modalidade: mod,
          novos: nMap.get(mod) ?? 0,
          cancelados: cMap.get(mod) ?? 0,
        })),
      };
    });

    // ── Permanência por faixa com breakdown por modalidade ──
    const FAIXA_ORDER = ['0-6 meses', '6-12 meses', '1-2 anos', '2+ anos'];
    const faixaData = new Map<string, Map<string, number>>();
    for (const r of faixaMod) {
      const mod = modLabel(modCode(r.modalidade));
      if (!faixaData.has(r.faixa)) faixaData.set(r.faixa, new Map());
      const m = faixaData.get(r.faixa)!;
      m.set(mod, (m.get(mod) ?? 0) + Number(r.total));
    }
    const permanenciaPorFaixa = FAIXA_ORDER
      .map((f) => {
        const modMap = faixaData.get(f) ?? new Map();
        const total = [...modMap.values()].reduce((s, v) => s + v, 0);
        return {
          faixa: f,
          total,
          porModalidade: modNames.map((mod) => ({ modalidade: mod, total: modMap.get(mod) ?? 0 })),
        };
      })
      .filter((f) => f.total > 0);

    // ── Churn por vendedor ──
    const churnPorVendedor = (churnVendedor as VendedorChurnRow[]).map((r) => ({
      vendedor: String(r.vendedor).trim(),
      cancelados: Number(r.cancelados),
      mrrPerdido: Math.round(Number(r.mrrPerdido)),
    }));

    return {
      totalAtivos,
      mrrAtual,
      novosNoPeriodo,
      canceladosNoPeriodo,
      mrrPerdido,
      mrrNovos,
      taxaRetencao,
      churnRate,
      tempoMedioPermanencia,
      saldoLiquido: novosNoPeriodo - canceladosNoPeriodo,
      mrrLiquido: mrrNovos - mrrPerdido,
      porModalidade,
      evolucaoMensal,
      permanenciaPorFaixa,
      churnPorVendedor,
    };
  }
}
