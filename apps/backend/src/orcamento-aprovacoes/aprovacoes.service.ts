import { createHash, randomUUID } from 'node:crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrcamentoAprovacao } from './orcamento-aprovacao.entity';

export interface CreateAprovacaoInput {
  orcamentoId?: string;
  vendaId?: string;
  propostaId?: string;
  clienteNome: string;
  clienteCpf?: string;
  assinaturaBase64: string;
  valorTotal: number;
  modalidade: string;
}

export interface AprovacaoContext {
  ip: string;
  userAgent: string;
  criadoPor: string;
}

@Injectable()
export class AprovacoesService {
  constructor(
    @InjectRepository(OrcamentoAprovacao, 'app')
    private readonly repo: Repository<OrcamentoAprovacao>,
  ) {}

  async create(input: CreateAprovacaoInput, ctx: AprovacaoContext): Promise<OrcamentoAprovacao> {
    if (!input.assinaturaBase64 || !input.assinaturaBase64.startsWith('data:image/')) {
      throw new BadRequestException('Assinatura ausente ou formato inválido');
    }
    if (!input.clienteNome?.trim()) {
      throw new BadRequestException('Nome do cliente é obrigatório');
    }

    const createdAt = new Date().toISOString();
    const hash = createHash('sha256')
      .update(input.assinaturaBase64)
      .update('|')
      .update(input.clienteCpf ?? '')
      .update('|')
      .update(String(input.valorTotal ?? 0))
      .update('|')
      .update(input.modalidade)
      .update('|')
      .update(createdAt)
      .digest('hex');

    const row = this.repo.create({
      id: randomUUID(),
      orcamentoId: input.orcamentoId ?? null,
      vendaId: input.vendaId ?? null,
      propostaId: input.propostaId ?? null,
      clienteNome: input.clienteNome.trim(),
      clienteCpf: (input.clienteCpf ?? '').trim(),
      assinaturaBase64: input.assinaturaBase64,
      assinaturaHash: hash,
      valorTotal: Number(input.valorTotal ?? 0),
      modalidade: input.modalidade,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      criadoPor: ctx.criadoPor,
      createdAt,
    });

    return this.repo.save(row);
  }

  async findOne(id: string): Promise<OrcamentoAprovacao> {
    const r = await this.repo.findOne({ where: { id } });
    if (!r) throw new NotFoundException(`Aprovação ${id} não encontrada`);
    return r;
  }

  async listByVenda(vendaId: string): Promise<OrcamentoAprovacao[]> {
    return this.repo.find({ where: { vendaId }, order: { createdAt: 'DESC' } });
  }
}
