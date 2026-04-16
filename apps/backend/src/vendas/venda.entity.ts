import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('vendas')
@Index(['criadoPor', 'status'])
export class Venda {
  @PrimaryColumn({ length: 100 })
  id!: string;

  @Column({ length: 200 })
  clienteNome!: string;

  @Column({ length: 50, default: '' })
  clienteTelefone!: string;

  @Column({ length: 200, default: '' })
  clienteEmail!: string;

  @Column({ length: 500, default: '' })
  clienteEndereco!: string;

  @Column({ length: 200, default: '' })
  clienteEmpresa!: string;

  @Column({ length: 30 })
  tipoLocal!: string;

  @Column({ type: 'text', default: '' })
  observacoes!: string;

  @Column({ length: 30 })
  status!: string;

  @Column({ type: 'varchar', length: 100, default: '' })
  solucaoId!: string;

  @Column({ type: 'varchar', length: 100, default: '' })
  vistoriaId!: string;

  @Column({ type: 'varchar', length: 100, default: '' })
  ordemId!: string;

  @Column({ type: 'varchar', length: 100, default: '' })
  propostaId!: string;

  @Column({ length: 100, default: '' })
  criadoPor!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  leadId!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  modalidade!: string | null;

  @Column({ type: 'float', nullable: true })
  monitoramentoMensal!: number | null;

  @Column({ type: 'float', nullable: true })
  maoDeObra!: number | null;

  @Column({ type: 'int', nullable: true })
  prazoComodato!: number | null;

  @Column({ type: 'float', nullable: true })
  acrescimoInstalacao!: number | null;

  @Column({ type: 'float', nullable: true })
  valorCrea!: number | null;

  @Column({ type: 'boolean', nullable: true })
  clienteAprovado!: boolean | null;

  @Column({ type: 'boolean', nullable: true })
  visita1Concluida!: boolean | null;

  @Column({ type: 'boolean', nullable: true })
  visita2Concluida!: boolean | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  contratoUrl!: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  contratoAssinadoEm!: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  instalacaoAgendadaEm!: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  instalacaoConcluidaEm!: string | null;

  @Column({ length: 40 })
  createdAt!: string;

  @Column({ length: 40 })
  updatedAt!: string;
}
