import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn
} from 'typeorm'

@Entity('lancamentos_financeiros')
export class LancamentoFinanceiro {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'enum', enum: ['Pagar', 'Receber'] })
  tipo: 'Pagar' | 'Receber'

  @Column({
    type: 'enum',
    enum: ['VendaCliente', 'PlanoCorte', 'Compra', 'Despesa'],
    nullable: true
  })
  origem: string

  @Column({ length: 100 })
  descricao: string

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor: number

  @Column()
  data_vencimento: Date

  @Column({ nullable: true })
  data_pagamento: Date

  @Column({ default: 'Pendente' })
  status: string

  @Column({ nullable: true })
  cliente_id: number

  @Column({ nullable: true })
  fornecedor_id: number

  @Column({ nullable: true })
  plano_corte_id: number

  @CreateDateColumn()
  created_at: Date
}
