import { AfterLoad, Column, Entity, Index, PrimaryColumn } from 'typeorm';

export interface PropostaItemJson {
  equipamentoId: string;
  nome: string;
  quantidade: number;
  precoUnitario: number;
}

@Entity('propostas_local')
@Index(['criadoPor', 'status'])
export class PropostaLocal {
  @PrimaryColumn({ length: 100 })
  id!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  leadId!: string | null;

  @Column({ length: 200 })
  clienteNome!: string;

  @Column({ length: 50, default: '' })
  clienteTel!: string;

  @Column({ length: 500, default: '' })
  clienteEndereco!: string;

  @Column({ length: 30 })
  tipoLocal!: string;

  @Column({ length: 50 })
  marca!: string;

  @Column({ type: 'simple-json', nullable: true })
  itens: PropostaItemJson[] | null = [];

  @Column({ type: 'text', default: '' })
  observacoes!: string;

  @Column({ length: 30 })
  status!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  kitBaseId!: string | null;

  @Column({ length: 100, default: '' })
  criadoPor!: string;

  @Column({ length: 40 })
  createdAt!: string;

  @Column({ length: 40 })
  updatedAt!: string;

  @AfterLoad()
  normalizeJsonFields() {
    if (!this.itens) this.itens = [];
  }
}
