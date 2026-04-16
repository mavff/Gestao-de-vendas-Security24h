import { AfterLoad, Column, Entity, Index, PrimaryColumn } from 'typeorm';

export interface PontoJson {
  id: string;
  environment: string;
  type: string;
  note: string;
  status: 'Pendente' | 'Em execução' | 'Finalizado';
  photos: string[];
  equipmentId?: string;
  locationTag?: string;
}

export interface AmbienteJson {
  id: string;
  nome: string;
  pontos: PontoJson[];
  status: 'pendente' | 'concluido';
}

export type TipoVistoria = 'vistoria' | 'entrega';

@Entity('vistorias')
@Index(['leadId', 'tipoVistoria'])
export class Vistoria {
  @PrimaryColumn({ length: 100 })
  id!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  leadId!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  propostaId!: string | null;

  @Column({ length: 20 })
  tipoVistoria!: TipoVistoria;

  @Column({ type: 'simple-json', nullable: true })
  ambientes: AmbienteJson[] | null = [];

  @Column({ type: 'varchar', length: 500, nullable: true })
  plantaUrl!: string | null;

  @Column({ type: 'text', default: '' })
  observacoes!: string;

  @Column({ length: 30 })
  status!: string;

  @Column({ length: 100, default: '' })
  criadoPor!: string;

  @Column({ length: 40 })
  createdAt!: string;

  @Column({ length: 40 })
  updatedAt!: string;

  @AfterLoad()
  normalizeJsonFields() {
    if (!this.ambientes) this.ambientes = [];
  }
}
