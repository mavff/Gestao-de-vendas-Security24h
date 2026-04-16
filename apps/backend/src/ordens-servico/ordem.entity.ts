import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
import type { AmbienteJson, PontoJson } from '../vistorias/vistoria.entity';

export interface ChecklistItemJson {
  id: string;
  text: string;
  done: boolean;
}

@Entity('ordens_servico')
@Index(['leadId'])
export class OrdemServico {
  @PrimaryColumn({ length: 100 })
  id!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  propostaId!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  vistoriaId!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  leadId!: string | null;

  @Column({ length: 200 })
  cliente!: string;

  @Column({ length: 40, default: '' })
  dataAgendada!: string;

  @Column({ length: 100, default: '' })
  tecnicoId!: string;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  checklist!: ChecklistItemJson[];

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  pontos!: PontoJson[];

  @Column({ type: 'jsonb', nullable: true })
  ambientes!: AmbienteJson[] | null;

  @Column({ type: 'text', default: '' })
  observacoes!: string;

  @Column({ length: 30 })
  status!: string;

  @Column({ length: 40 })
  createdAt!: string;
}
