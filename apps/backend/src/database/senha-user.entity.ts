import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'Senhas' })
export class SenhaUser {
  @PrimaryColumn({ name: 'IDUsuário', type: 'int' })
  idUsuario!: number;

  @Column({ name: 'Usuário', type: 'nvarchar' })
  usuario!: string;

  @Column({ name: 'Senhasis', type: 'nvarchar' })
  senhaSis!: string;

  @Column({ name: 'Identificação', type: 'nvarchar', nullable: true })
  identificacao?: string;

  @Column({ name: 'UsuárioInativo', type: 'bit', nullable: true })
  usuarioInativo?: boolean;
}
