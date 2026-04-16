import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('photos')
@Index(['entityType', 'entityId'])
export class Photo {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 50 })
  entityType!: string;

  @Column({ length: 100 })
  entityId!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  pontoId!: string | null;

  @Column({ length: 500 })
  filePath!: string;

  @Column({ length: 50, default: 'image/jpeg' })
  mimeType!: string;

  @Column({ type: 'int', nullable: true })
  createdBy!: number | null;

  @CreateDateColumn()
  createdAt!: Date;
}
