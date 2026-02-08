import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Orcamento } from '../database/orcamento.entity';
import { OrcamentoProduto } from '../database/orcamento-produto.entity';
import { CreateQuoteDto, CreateQuoteItemDto } from './dto';

@Injectable()
export class QuotesService {
  constructor(
    @InjectRepository(Orcamento) private readonly quoteRepo: Repository<Orcamento>,
    @InjectRepository(OrcamentoProduto) private readonly quoteItemRepo: Repository<OrcamentoProduto>
  ) {}

  create(dto: CreateQuoteDto, username: string) {
    // Nota: schema legado possui muitas colunas; gravamos somente subset seguro e obrigatório para MVP.
    const quote = this.quoteRepo.create({
      clienteNome: dto.clienteNome,
      prospect: dto.prospect,
      observacoes: dto.observacoes,
      emissao: new Date(),
      status: 'A',
      usuario: username,
      totalProdutos: '0',
      totalServicos: '0'
    });

    return this.quoteRepo.save(quote);
  }

  async addItems(id: number, items: CreateQuoteItemDto[]) {
    const quote = await this.quoteRepo.findOne({ where: { codInterno: id } });
    if (!quote) throw new NotFoundException('Orçamento não encontrado');

    const mapped = items.map((item) =>
      this.quoteItemRepo.create({
        codProduto: item.codProduto,
        descricao: item.descricao,
        quantidade: item.quantidade.toFixed(2),
        unitario: item.unitario.toFixed(2),
        total: (item.quantidade * item.unitario).toFixed(2)
      })
    );

    const saved = await this.quoteItemRepo.save(mapped);
    const total = saved.reduce((acc, cur) => acc + Number(cur.total), 0);
    quote.totalProdutos = (Number(quote.totalProdutos) + total).toFixed(2);
    await this.quoteRepo.save(quote);

    return saved;
  }

  async details(id: number) {
    const quote = await this.quoteRepo.findOne({ where: { codInterno: id } });
    if (!quote) throw new NotFoundException('Orçamento não encontrado');

    // Ambiguidade no legado: vínculo de item pode ocorrer por Planílha em vez de CodInterno.
    const items = await this.quoteItemRepo.find({ order: { codInterno: 'DESC' }, take: 100 });
    return { ...quote, items };
  }
}
