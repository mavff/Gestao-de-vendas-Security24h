import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'OrçamentosProdutos' })
export class OrcamentoProduto {
  @PrimaryGeneratedColumn({ name: 'CodInterno', type: 'int' })
  codInterno!: number;

  @Column({ name: 'Planílha', type: 'int', nullable: true })
  planilha?: number;

  @Column({ name: 'CodProduto', type: 'int' })
  codProduto!: number;

  @Column({ name: 'Descrição', type: 'nvarchar' })
  descricao!: string;

  @Column({ name: 'Quantidade', type: 'decimal', precision: 18, scale: 2 })
  quantidade!: string;

  @Column({ name: 'Unitário', type: 'decimal', precision: 18, scale: 2 })
  unitario!: string;

  @Column({ name: 'Total', type: 'decimal', precision: 18, scale: 2 })
  total!: string;
}
