import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'ProspectsAçãoVendas' })
export class ProspectAcaoVenda {
  @PrimaryGeneratedColumn({ name: 'CodAção', type: 'int' })
  codAcao!: number;

  @Column({ name: 'CodProspect', type: 'int' })
  codProspect!: number;

  @Column({ name: 'Data', type: 'datetime' })
  data!: Date;

  @Column({ name: 'Hora', type: 'nvarchar', nullable: true })
  hora?: string;

  @Column({ name: 'Descrição', type: 'nvarchar' })
  descricao!: string;

  @Column({ name: 'Ação', type: 'int', nullable: true })
  acao?: number;

  @Column({ name: 'Vendedor', type: 'int', nullable: true })
  vendedor?: number;
}
