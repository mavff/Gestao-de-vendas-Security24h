import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'Prospects' })
export class Prospect {
  @PrimaryGeneratedColumn({ name: 'CodProspect', type: 'int' })
  codProspect!: number;

  @Column({ name: 'Nome', type: 'nvarchar' })
  nome!: string;

  @Column({ name: 'Email', type: 'nvarchar', nullable: true })
  email?: string;

  @Column({ name: 'Fone1', type: 'nvarchar', nullable: true })
  fone1?: string;

  @Column({ name: 'Cidade', type: 'nvarchar', nullable: true })
  cidade?: string;

  @Column({ name: 'Estado', type: 'nvarchar', nullable: true })
  estado?: string;

  @Column({ name: 'Origem', type: 'int', nullable: true })
  origem?: number;

  @Column({ name: 'Status', type: 'char', default: 'A' })
  status!: string;

  @Column({ name: 'DataCadastro', type: 'datetime', nullable: true })
  dataCadastro?: Date;

  @Column({ name: 'Usuário', type: 'nvarchar', nullable: true })
  usuario?: string;
}
