import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'Orçamentos' })
export class Orcamento {
  @PrimaryGeneratedColumn({ name: 'CodInterno', type: 'int' })
  codInterno!: number;

  @Column({ name: 'ClienteNome', type: 'nvarchar' })
  clienteNome!: string;

  @Column({ name: 'Prospect', type: 'int', nullable: true })
  prospect?: number;

  @Column({ name: 'Status', type: 'char', default: 'A' })
  status!: string;

  @Column({ name: 'Emissão', type: 'datetime' })
  emissao!: Date;

  @Column({ name: 'Usuário', type: 'nvarchar', nullable: true })
  usuario?: string;

  @Column({ name: 'Observações', type: 'nvarchar', nullable: true })
  observacoes?: string;

  @Column({ name: 'TotalProdutos', type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalProdutos!: string;

  @Column({ name: 'TotalServiços', type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalServicos!: string;
}
