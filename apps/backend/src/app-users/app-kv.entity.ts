import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

/** Generic key-value store for app state (pipeline overrides, missions, etc.) */
@Entity('app_kv')
export class AppKv {
  @PrimaryColumn({ length: 100 })
  key!: string;

  @Column({ type: 'text', default: '{}' })
  value!: string;

  @Column({ type: 'integer', nullable: true })
  userId!: number | null;

  @UpdateDateColumn()
  updatedAt!: Date;
}
