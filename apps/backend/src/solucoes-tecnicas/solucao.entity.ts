import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

export interface SolucaoBlocoJson {
  categoria: string;
  itens: Array<{ equipmentId: string; quantidade: number; observacao: string }>;
}

export interface SolucaoServicoJson {
  descricao: string;
  valor: number;
  tipo: 'instalacao' | 'mensalidade';
}

@Entity('solucoes')
@Index(['criadoPor', 'status'])
export class Solucao {
  @PrimaryColumn({ length: 100 })
  id!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  leadId!: string | null;

  @Column({ length: 200 })
  clienteNome!: string;

  @Column({ length: 50 })
  marca!: string;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  blocos!: SolucaoBlocoJson[];

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  servicos!: SolucaoServicoJson[];

  @Column({ type: 'text', default: '' })
  observacaoGeral!: string;

  @Column({ length: 30 })
  status!: string;

  @Column({ length: 100, default: '' })
  criadoPor!: string;

  @Column({ length: 40 })
  createdAt!: string;

  @Column({ length: 40 })
  updatedAt!: string;
}
