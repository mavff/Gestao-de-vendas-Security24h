import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('orcamento_aprovacoes')
@Index(['vendaId'])
@Index(['criadoPor', 'createdAt'])
export class OrcamentoAprovacao {
  @PrimaryColumn({ length: 100 })
  id!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  orcamentoId!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  vendaId!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  propostaId!: string | null;

  @Column({ length: 200 })
  clienteNome!: string;

  @Column({ length: 30, default: '' })
  clienteCpf!: string;

  /** Data URL PNG da assinatura manuscrita capturada no canvas. */
  @Column({ type: 'text' })
  assinaturaBase64!: string;

  /** SHA-256 de (assinatura + cpf + valorTotal + modalidade + createdAt).
   *  Fica exposto como "código de verificação" no selo do PDF. */
  @Column({ length: 64 })
  assinaturaHash!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  valorTotal!: number;

  @Column({ length: 20 })
  modalidade!: string;

  @Column({ length: 60, default: '' })
  ip!: string;

  @Column({ type: 'text', default: '' })
  userAgent!: string;

  @Column({ length: 100, default: '' })
  criadoPor!: string;

  @Column({ length: 40 })
  createdAt!: string;
}
