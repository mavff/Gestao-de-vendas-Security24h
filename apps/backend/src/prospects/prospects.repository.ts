import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { buildPaginatedResponse, PaginatedResponse, parsePagination, PaginationQuery } from '../shared/pagination';

export interface ProspectFilters extends PaginationQuery {
  q?: string;
  status?: string;
  vendedor?: number;
  origem?: number;
}

@Injectable()
export class ProspectsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: ProspectFilters = {}): Promise<PaginatedResponse<any>> {
    this.prisma.ensureConnection();

    const { skip, take, page, pageSize } = parsePagination(filters);

    // Constrói o filtro usando AND para permitir combinar OR de busca com OR de status/inativo
    const andConditions: any[] = [];

    if (filters.q) {
      andConditions.push({
        OR: [
          { nome: { contains: filters.q } },
          { email: { contains: filters.q } },
          { cpf: { contains: filters.q } },
        ],
      });
    }

    if (filters.status) {
      andConditions.push({ status: filters.status });
    } else {
      // Por padrão: inclui ativos ('A') e convertidos ('X'), exclui cancelados ('C') e inativos
      andConditions.push({ status: { not: 'C' } });
      andConditions.push({ OR: [{ inativo: false }, { inativo: null }] });
    }

    if (filters.vendedor !== undefined) {
      andConditions.push({ vendedor: filters.vendedor });
    }
    if (filters.origem !== undefined) {
      andConditions.push({ origem: filters.origem });
    }

    const where = andConditions.length > 0 ? { AND: andConditions } : {};

    const [items, total] = await Promise.all([
      this.prisma.prospect.findMany({
        where,
        orderBy: { dataCadastro: 'desc' },
        skip,
        take,
      }),
      this.prisma.prospect.count({ where }),
    ]);

    // Busca totais de orçamento por prospect (em paralelo)
    const codProspects = items.map((p) => p.codProspect);

    const [orcTotals, origemLabels, ultimasAcoes] = await Promise.all([
      codProspects.length > 0
        ? this.prisma.orcamento.groupBy({
            by: ['prospect'],
            where: { prospect: { in: codProspects }, status: { not: 'C' } },
            _sum: { totalProdutos: true, totalServicos: true },
          })
        : [],

      // Lookup dos labels de origem na DadosEntidades
      (() => {
        const origemCodes = [...new Set(items.map((p) => p.origem).filter(Boolean))] as number[];
        return origemCodes.length > 0
          ? this.prisma.dadoEntidade.findMany({
              where: { codInterno: { in: origemCodes } },
              select: { codInterno: true, descreve: true },
            })
          : [];
      })(),

      // Última ação de vendas por prospect (probabilidade + descrição)
      codProspects.length > 0
        ? this.prisma.prospectAcaoVenda.findMany({
            where: { codProspect: { in: codProspects } },
            orderBy: [{ data: 'desc' }, { codAcao: 'desc' }],
            select: { codProspect: true, probabilidade: true, descricao: true, data: true },
          })
        : [],
    ]);

    const orcMap = new Map(
      orcTotals
        .filter((o) => o.prospect != null)
        .map((o) => [
          o.prospect as number,
          Number(o._sum.totalProdutos ?? 0) + Number(o._sum.totalServicos ?? 0),
        ]),
    );

    const origemMap = new Map(
      (origemLabels as { codInterno: number; descreve: string }[]).map((o) => [o.codInterno, o.descreve]),
    );

    // Deduplica em JS: primeira ocorrência (após orderBy desc) = mais recente
    const acaoMap = new Map<number, { probabilidade: number | null; descricao: string; data: Date }>();
    for (const a of ultimasAcoes as { codProspect: number; probabilidade: number | null; descricao: string; data: Date }[]) {
      if (!acaoMap.has(a.codProspect)) {
        acaoMap.set(a.codProspect, { probabilidade: a.probabilidade, descricao: a.descricao, data: a.data });
      }
    }

    const enriched = items.map((p) => {
      const acao = acaoMap.get(p.codProspect);
      return {
        ...p,
        orcamentoTotal: orcMap.get(p.codProspect) ?? 0,
        origemDescreve: p.origem ? (origemMap.get(p.origem) ?? null) : null,
        ultimaProbabilidade: acao?.probabilidade ?? null,
        ultimaAcaoDescricao: acao?.descricao ?? null,
        ultimaAcaoData: acao?.data?.toISOString() ?? null,
      };
    });

    return buildPaginatedResponse(enriched, total, page, pageSize);
  }

  async findById(codProspect: number) {
    this.prisma.ensureConnection();

    const prospect = await this.prisma.prospect.findUnique({
      where: { codProspect },
      include: {
        acoes: {
          orderBy: { data: 'desc' },
          take: 50,
        },
      },
    });

    if (!prospect) {
      throw new NotFoundException('Prospect não encontrado');
    }

    return prospect;
  }
}
