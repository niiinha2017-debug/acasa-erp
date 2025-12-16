import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn
} from 'typeorm'

@Entity('despesas')
export class Despesa {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ length: 200 })
  descricao: string

  @Column({ length: 100, nullable: true })
  categoria: string

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor: number

  @Column({ type: 'date' })
  data_vencimento: Date

  @Column({ type: 'date', nullable: true })
  data_pagamento: Date

  @Column({
    type: 'enum',
    enum: ['Pendente', 'Pago', 'Cancelado'],
    default: 'Pendente'
  })
  status: string

  @Column({ nullable: true })
  fornecedor_id: number

  @Column({ type: 'text', nullable: true })
  observacao: string

  @CreateDateColumn()
  created_at: Date
}
