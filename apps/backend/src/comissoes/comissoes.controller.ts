import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { ComissoesRepository } from './comissoes.repository';

@Controller('comissoes')
@UseGuards(JwtGuard)
export class ComissoesController {
  constructor(private readonly repo: ComissoesRepository) {}

  @Get('vendedores')
  async getVendedores() {
    const rows = await this.repo.getOrcamentosComodato();

    const now = new Date();
    const byVendedor = new Map<string, {
      usuario: string;
      clientes: {
        codInterno: number;
        numOrcamento: number | null;
        clienteNome: string;
        cgcCpf: string | null;
        status: string;
        modalidade: string | null;
        fechamento: string | null;
        emissao: string | null;
        totalProdutos: number;
        totalServicos: number;
        valorMonitoramento: number;
        comissaoBd: number;
        pontos: number | null;
        mesesAtivos: number;
        diaVencimento: number | null;
        primeiroFaturamento: string | null;
      }[];
    }>();

    for (const row of rows) {
      const usuario = row.usuario?.trim() || 'Sem vendedor';
      if (!byVendedor.has(usuario)) {
        byVendedor.set(usuario, { usuario, clientes: [] });
      }

      // Carência: usa PrimeiroFaturamento do cliente (data real de início da cobrança),
      // senão fallback para Fechamento do orçamento
      const dataRef = row.primeiroFaturamento || row.fechamento || row.emissao;
      let mesesAtivos = 0;
      if (dataRef) {
        const d = new Date(dataRef);
        mesesAtivos = Math.max(0,
          (now.getFullYear() - d.getFullYear()) * 12 +
          (now.getMonth() - d.getMonth())
        );
      }

      const diaVenc = row.diaVencimento != null ? Number(row.diaVencimento) : null;

      byVendedor.get(usuario)!.clientes.push({
        codInterno: row.codInterno,
        numOrcamento: row.numOrcamento,
        clienteNome: row.clienteNome?.trim() || 'Sem nome',
        cgcCpf: row.cgcCpf,
        status: row.status,
        modalidade: row.modalidade,
        fechamento: row.fechamento,
        emissao: row.emissao,
        totalProdutos: Math.round(row.totalProdutos),
        totalServicos: Math.round(row.totalServicos),
        valorMonitoramento: Number(row.valorMonitoramento),
        comissaoBd: Math.round(row.comissao),
        pontos: row.pontos,
        mesesAtivos,
        diaVencimento: diaVenc && diaVenc > 0 ? diaVenc : null,
        primeiroFaturamento: row.primeiroFaturamento,
      });
    }

    return {
      vendedores: Array.from(byVendedor.values()),
      totalClientes: rows.length,
    };
  }

  @Get('usuarios-disponiveis')
  async getUsuariosDisponiveis() {
    const usuarios = await this.repo.getUsuariosDisponiveis();
    return { usuarios };
  }

  @Get('clientes-ativos')
  async getClientesAtivos() {
    const clientes = await this.repo.getClientesAtivos();
    return { clientes, total: clientes.length };
  }
}
