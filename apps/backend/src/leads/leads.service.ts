import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prospect } from '../database/prospect.entity';
import { ProspectAcaoVenda } from '../database/prospect-acao-venda.entity';
import { CreateLeadDto, CreateTimelineDto } from './dto';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Prospect) private readonly leadsRepo: Repository<Prospect>,
    @InjectRepository(ProspectAcaoVenda) private readonly timelineRepo: Repository<ProspectAcaoVenda>
  ) {}

  create(dto: CreateLeadDto, username: string) {
    const lead = this.leadsRepo.create({ ...dto, status: 'A', dataCadastro: new Date(), usuario: username });
    return this.leadsRepo.save(lead);
  }

  async list(page = 1, pageSize = 20) {
    const [items, total] = await this.leadsRepo.findAndCount({
      order: { codProspect: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize
    });

    return { items, total, page, pageSize };
  }

  async details(id: number) {
    const lead = await this.leadsRepo.findOne({ where: { codProspect: id } });
    if (!lead) throw new NotFoundException('Lead não encontrado');

    const timeline = await this.timelineRepo.find({ where: { codProspect: id }, order: { codAcao: 'DESC' }, take: 50 });
    return { ...lead, timeline };
  }

  addTimeline(id: number, dto: CreateTimelineDto) {
    const item = this.timelineRepo.create({
      codProspect: id,
      descricao: dto.descricao,
      acao: dto.acao,
      data: new Date(),
      hora: new Date().toISOString().slice(11, 16)
    });
    return this.timelineRepo.save(item);
  }
}
