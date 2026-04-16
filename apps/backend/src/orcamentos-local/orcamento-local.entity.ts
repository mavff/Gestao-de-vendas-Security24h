import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

export interface OrcamentoItemJson {
  equipmentId: string;
  nome: string;
  quantidade: number;
  precoUnitario: number;
  precoCusto: number;
  subtotal: number;
  subtotalCusto: number;
  bloco: string;
}

export interface ComodatoJson {
  prazo: 24 | 36 | 48;
  numCameras: number;
  tipoCentral: 'pequena' | 'media' | 'grande';
}

@Entity('orcamentos_local')
@Index(['status'])
export class OrcamentoLocal {
  @PrimaryColumn({ length: 100 })
  id!: string;

  @Column({ type: 'int' })
  numero!: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  solucaoId!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  leadId!: string | null;

  @Column({ length: 200 })
  clienteNome!: string;

  @Column({ length: 50 })
  marca!: string;

  @Column({ type: 'int', default: 0 })
  zonas!: number;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  itens!: OrcamentoItemJson[];

  @Column({ type: 'float', default: 0 })
  subtotalEquipamentos!: number;

  @Column({ type: 'float', default: 0 })
  subtotalCusto!: number;

  @Column({ type: 'float', default: 1 })
  fatorZona!: number;

  @Column({ type: 'float', default: 0 })
  totalEquipamentos!: number;

  @Column({ type: 'float', default: 0 })
  maoDeObra!: number;

  @Column({ type: 'float', default: 0 })
  mensalidade!: number;

  @Column({ type: 'float', default: 0 })
  desconto!: number;

  @Column({ type: 'float', default: 0 })
  totalFinal!: number;

  @Column({ type: 'text', default: '' })
  observacoes!: string;

  @Column({ length: 30 })
  status!: string;

  @Column({ length: 20 })
  modalidade!: string;

  @Column({ type: 'jsonb', nullable: true })
  comodato!: ComodatoJson | null;

  @Column({ length: 40 })
  createdAt!: string;
}
