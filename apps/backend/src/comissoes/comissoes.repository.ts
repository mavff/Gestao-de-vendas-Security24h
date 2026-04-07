import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

const EMPRESA_IDS = [2, 1002];

type ComodatoOrcamentoRow = {
  codInterno: number;
  numOrcamento: number | null;
  clienteNome: string | null;
  cgcCpf: string | null;
  vendedor: number | null;
  usuario: string | null;
  status: string;
  modalidade: string | null;
  emissao: string | null;
  fechamento: string | null;
  totalProdutos: number;
  totalServicos: number;
  valorMonitoramento: number;
  comissao: number;
  pontos: number | null;
  diaVencimento: number | null;
  primeiroFaturamento: string | null;
};

@Injectable()
export class ComissoesRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Busca todos os orcamentos comodato efetivados (status L, E, F)
   * com valorMonitoramento > 0, agrupaveis por vendedor.
   */
  /** Lista todos os usuários distintos que têm orçamentos com monitoramento */
  async getUsuariosDisponiveis(): Promise<string[]> {
    this.prisma.ensureConnection();

    const rows = await this.prisma.$queryRaw<{ usuario: string }[]>`
      SELECT DISTINCT LTRIM(RTRIM(o.[Usuário])) AS usuario
      FROM [Orçamentos] o
      WHERE o.[Empresa] IN (2, 1002)
        AND o.[Status] IN ('L', 'E', 'F')
        AND o.[ValorMonitoramento] IS NOT NULL
        AND o.[ValorMonitoramento] > 0
        AND o.[Usuário] IS NOT NULL
      ORDER BY usuario
    `;

    return rows.map((r) => r.usuario);
  }

  async getOrcamentosComodato(): Promise<ComodatoOrcamentoRow[]> {
    this.prisma.ensureConnection();

    const rows = await this.prisma.$queryRaw<ComodatoOrcamentoRow[]>`
      SELECT
        o.[CodInterno] AS codInterno,
        o.[NumOrçamento] AS numOrcamento,
        LTRIM(RTRIM(o.[ClienteNome])) AS clienteNome,
        o.[CGCCPF] AS cgcCpf,
        o.[Vendedor] AS vendedor,
        LTRIM(RTRIM(o.[Usuário])) AS usuario,
        o.[Status] AS status,
        o.[Modalidade] AS modalidade,
        o.[Emissão] AS emissao,
        o.[Fechamento] AS fechamento,
        CAST(ISNULL(o.[TotalProdutos], 0) AS FLOAT) AS totalProdutos,
        CAST(ISNULL(o.[TotalServiços], 0) AS FLOAT) AS totalServicos,
        CAST(ISNULL(o.[ValorMonitoramento], 0) AS FLOAT) AS valorMonitoramento,
        CAST(ISNULL(o.[Comissão], 0) AS FLOAT) AS comissao,
        o.[Pontos] AS pontos,
        c.[DiaVencimento] AS diaVencimento,
        c.[PrimeiroFaturamento] AS primeiroFaturamento
      FROM [Orçamentos] o
      LEFT JOIN [Clientes] c ON c.[CodCliente] = o.[Cliente]
      WHERE o.[Empresa] IN (2, 1002)
        AND o.[Status] IN ('L', 'E', 'F')
        AND o.[ValorMonitoramento] IS NOT NULL
        AND o.[ValorMonitoramento] > 0
      ORDER BY o.[Usuário], o.[Fechamento] DESC
    `;

    return rows;
  }

  /** Clientes ativos — todos os que estão sendo cobrados (ValorNF > 0) */
  async getClientesAtivos() {
    this.prisma.ensureConnection();

    type ClienteAtivoRow = {
      codCliente: number;
      nome: string;
      fantasia: string | null;
      cgcCpf: string | null;
      fone1: string | null;
      cidade: string | null;
      modalidade: string | null;
      vendedorNome: string | null;
      tecnicoNome: string | null;
      valorMonitoramento: number;
      diaVencimento: number | null;
      primeiroFaturamento: string | null;
      dataCadastro: string | null;
      dataFechamento: string | null;
    };

    const rows = await this.prisma.$queryRaw<ClienteAtivoRow[]>`
      SELECT
        c.[CodCliente] AS codCliente,
        LTRIM(RTRIM(c.[Nome])) AS nome,
        LTRIM(RTRIM(c.[Fantasia])) AS fantasia,
        c.[CGCCPF] AS cgcCpf,
        c.[Fone1] AS fone1,
        LTRIM(RTRIM(c.[Cidade])) AS cidade,
        c.[Modalidade] AS modalidade,
        LTRIM(RTRIM(COALESCE(sv.[Identificação], sv.[Usuário]))) AS vendedorNome,
        LTRIM(RTRIM(COALESCE(st.[Identificação], st.[Usuário]))) AS tecnicoNome,
        CAST(ISNULL(c.[ValorNF], 0) AS FLOAT) AS valorMonitoramento,
        c.[DiaVencimento] AS diaVencimento,
        c.[PrimeiroFaturamento] AS primeiroFaturamento,
        c.[DataCadastro] AS dataCadastro,
        (
          SELECT TOP 1 o.[Fechamento]
          FROM [Orçamentos] o
          WHERE o.[Cliente] = c.[CodCliente]
            AND o.[Status] IN ('L', 'E', 'F')
          ORDER BY o.[Fechamento] DESC
        ) AS dataFechamento
      FROM [Clientes] c
      LEFT JOIN [Senhas] sv ON sv.[IDUsuário] = c.[Vendedor]
      LEFT JOIN [Senhas] st ON st.[IDUsuário] = c.[Técnico]
      WHERE c.[Empresa] IN (2, 1002)
        AND c.[Cancelamento] IS NULL
        AND c.[ValorNF] > 0
      ORDER BY LTRIM(RTRIM(COALESCE(sv.[Identificação], sv.[Usuário]))), c.[Nome]
    `;

    return rows.map((r) => ({
      ...r,
      valorMonitoramento: Number(r.valorMonitoramento),
      diaVencimento: r.diaVencimento != null ? Number(r.diaVencimento) : null,
    }));
  }
}
