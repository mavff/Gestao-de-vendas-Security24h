import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { buildPaginatedResponse, PaginatedResponse, parsePagination, PaginationQuery } from '../shared/pagination';

export interface OrcamentoFilters extends PaginationQuery {
  q?: string;
  status?: string;
  vendedor?: number;
  prospect?: number;
  modalidade?: string;
  dataInicio?: string; // ISO date YYYY-MM-DD
  dataFim?: string;    // ISO date YYYY-MM-DD
}

const EMPRESA_IDS = [2, 1002];

function buildDateFilter(dataInicio?: string, dataFim?: string) {
  if (!dataInicio && !dataFim) return undefined;
  const filter: Record<string, Date> = {};
  if (dataInicio) filter.gte = new Date(dataInicio + 'T00:00:00.000Z');
  if (dataFim)    filter.lte = new Date(dataFim   + 'T23:59:59.999Z');
  return filter;
}

@Injectable()
export class OrcamentosRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: OrcamentoFilters = {}): Promise<PaginatedResponse<any>> {
    this.prisma.ensureConnection();

    const { skip, take, page, pageSize } = parsePagination(filters);
    const where: Record<string, any> = { empresa: { in: EMPRESA_IDS } };

    if (filters.q) {
      where.OR = [
        { clienteNome: { contains: filters.q } },
        { cgcCpf: { contains: filters.q } },
        { observacoes: { contains: filters.q } },
      ];
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.vendedor !== undefined) {
      where.vendedor = filters.vendedor;
    }
    if (filters.prospect !== undefined) {
      where.prospect = filters.prospect;
    }
    if (filters.modalidade) {
      where.modalidade = filters.modalidade;
    }

    const emissaoFilter = buildDateFilter(filters.dataInicio, filters.dataFim);
    if (emissaoFilter) {
      where.emissao = emissaoFilter;
    }

    const [items, total] = await Promise.all([
      this.prisma.orcamento.findMany({
        where,
        orderBy: { emissao: 'desc' },
        skip,
        take,
        select: {
          codInterno: true,
          numOrcamento: true,
          clienteNome: true,
          cgcCpf: true,
          cidade: true,
          uf: true,
          vendedor: true,
          status: true,
          modalidade: true,
          emissao: true,
          validade: true,
          fechamento: true,
          pontos: true,
          totalProdutos: true,
          totalServicos: true,
          valorMonitoramento: true,
          etapa: true,
          probabilidade: true,
        },
      }),
      this.prisma.orcamento.count({ where }),
    ]);

    return buildPaginatedResponse(items, total, page, pageSize);
  }

  async getFunnel(dataInicio?: string, dataFim?: string) {
    this.prisma.ensureConnection();

    const emissaoFilter = buildDateFilter(dataInicio, dataFim);
    const baseWhere: Record<string, any> = { empresa: { in: EMPRESA_IDS }, ...(emissaoFilter ? { emissao: emissaoFilter } : {}) };
    const prospectWhere: Record<string, any> = {};
    if (emissaoFilter) prospectWhere.dataCadastro = emissaoFilter;

    const [
      totalOrcamentos,
      abertos,
      emAprovacao,
      liberados,
      emInstalacao,
      faturados,
      cancelados,
      prospects,
      ticketAgg,
    ] = await Promise.all([
      this.prisma.orcamento.count({ where: { ...baseWhere, status: { not: 'C' } } }),
      this.prisma.orcamento.count({ where: { ...baseWhere, status: 'A' } }),
      this.prisma.orcamento.count({ where: { ...baseWhere, status: 'P' } }),
      this.prisma.orcamento.count({ where: { ...baseWhere, status: 'L' } }),
      this.prisma.orcamento.count({ where: { ...baseWhere, status: 'E' } }),
      this.prisma.orcamento.count({ where: { ...baseWhere, status: 'F' } }),
      this.prisma.orcamento.count({ where: { ...baseWhere, status: 'C' } }),
      this.prisma.prospect.count({ where: prospectWhere }),
      this.prisma.orcamento.aggregate({
        _avg: { totalProdutos: true, valorMonitoramento: true },
        where: { ...baseWhere, status: { not: 'C' } },
      }),
    ]);

    const avancados = faturados + liberados + emInstalacao;
    const taxaConversao = totalOrcamentos > 0
      ? Math.round((avancados / totalOrcamentos) * 100)
      : 0;

    return {
      prospects,
      totalOrcamentos,
      abertos,
      emAprovacao,
      liberados,
      emInstalacao,
      faturados,
      cancelados,
      avancados,
      taxaConversao,
      ticketMedioEquip: Number(ticketAgg._avg.totalProdutos) || 0,
      ticketMedioMensal: Number(ticketAgg._avg.valorMonitoramento) || 0,
    };
  }

  /**
   * Agrega todos os produtos dos orçamentos que resultaram em venda (status F, L ou E)
   * no período informado. Agrupa por codProduto + descricao somando quantidades.
   */
  async getMateriaisVendidos(dataInicio?: string, dataFim?: string) {
    this.prisma.ensureConnection();

    const emissaoFilter = buildDateFilter(dataInicio, dataFim);
    const baseWhere: Record<string, any> = {
      empresa: { in: EMPRESA_IDS },
      status: { in: ['F', 'L', 'E'] },
      ...(emissaoFilter ? { emissao: emissaoFilter } : {}),
    };

    // Busca orçamentos vendidos com seus produtos
    const orcamentos = await this.prisma.orcamento.findMany({
      where: baseWhere,
      select: {
        codInterno: true,
        numOrcamento: true,
        clienteNome: true,
        emissao: true,
        status: true,
        totalProdutos: true,
        totalServicos: true,
        valorMonitoramento: true,
        produtos: {
          select: {
            codProduto: true,
            descricao: true,
            quantidade: true,
            unitario: true,
            total: true,
            liquido: true,
            grupoOrcamento: true,
          },
        },
      },
      orderBy: { emissao: 'desc' },
    });

    // Agrega produtos por codProduto+descricao
    const prodMap = new Map<string, {
      codProduto: number | null;
      descricao: string;
      grupoOrcamento: string | null;
      quantidadeTotal: number;
      valorTotal: number;
      ocorrencias: number; // em quantos orçamentos aparece
    }>();

    for (const orc of orcamentos) {
      for (const p of orc.produtos) {
        const key = `${p.codProduto ?? 0}::${p.descricao ?? 'Sem descrição'}`;
        const qtd = Number(p.quantidade ?? 0);
        const val = Number(p.total ?? 0) || (Number(p.liquido ?? p.unitario ?? 0) * qtd);

        const existing = prodMap.get(key);
        if (existing) {
          existing.quantidadeTotal += qtd;
          existing.valorTotal += val;
          existing.ocorrencias += 1;
        } else {
          prodMap.set(key, {
            codProduto: p.codProduto,
            descricao: p.descricao ?? 'Sem descrição',
            grupoOrcamento: p.grupoOrcamento ?? null,
            quantidadeTotal: qtd,
            valorTotal: val,
            ocorrencias: 1,
          });
        }
      }
    }

    const produtos = Array.from(prodMap.values())
      .sort((a, b) => b.quantidadeTotal - a.quantidadeTotal);

    const totalOrcamentosVendidos = orcamentos.length;
    const totalItensUnicos = produtos.length;
    const totalPecas = produtos.reduce((s, p) => s + p.quantidadeTotal, 0);
    const totalValorProdutos = produtos.reduce((s, p) => s + p.valorTotal, 0);
    const totalValorMensalidades = orcamentos.reduce(
      (s, o) => s + Number(o.valorMonitoramento ?? 0), 0,
    );

    return {
      resumo: {
        totalOrcamentosVendidos,
        totalItensUnicos,
        totalPecas,
        totalValorProdutos,
        totalValorMensalidades,
      },
      produtos,
      orcamentos: orcamentos.map((o) => ({
        codInterno: o.codInterno,
        numOrcamento: o.numOrcamento,
        clienteNome: o.clienteNome,
        emissao: o.emissao,
        status: o.status,
        totalProdutos: o.totalProdutos,
        totalServicos: o.totalServicos,
        valorMonitoramento: o.valorMonitoramento,
        qtdProdutos: o.produtos.length,
      })),
    };
  }

  async findById(codInterno: number) {
    this.prisma.ensureConnection();

    const orcamento = await this.prisma.orcamento.findUnique({
      where: { codInterno },
      include: {
        produtos: { orderBy: { codInterno: 'asc' } },
        servicosAdicionais: { orderBy: { codInterno: 'asc' } },
      },
    });

    if (!orcamento) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    return orcamento;
  }
}
