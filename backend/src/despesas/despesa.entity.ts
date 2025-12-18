import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm'

@Entity('despesas')
export class Despesa {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ length: 255 })
  descricao: string

  @Column({ length: 100, nullable: true })
  categoria: string

  // campo existente no banco
  @Column({ type: 'date' })
  data: Date

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor: number

  @Column({ type: 'date', nullable: true })
  data_vencimento: Date

  @Column({ type: 'date', nullable: true })
  data_pagamento: Date

  // 🔥 STATUS É APENAS UM CÓDIGO DA CONSTANTE
  @Column({ length: 50 })
  status: string

  @Column({ length: 50, nullable: true })
  forma_pagamento: string

  @Column({ length: 100, nullable: true })
  centro_custo: string

  @Column({ type: 'text', nullable: true })
  observacao: string

  @CreateDateColumn()
  created_at: Date
}
