import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('app_users')
export class AppUser {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, length: 50 })
  username!: string;

  @Column({ length: 255 })
  passwordHash!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({ length: 20, default: 'VENDEDOR' })
  role!: string;

  @Column({ default: true })
  active!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
