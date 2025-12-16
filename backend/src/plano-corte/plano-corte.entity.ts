import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany
} from 'typeorm'
import { ItemPlanoCorte } from './item-plano-corte.entity'

@Entity('planos_corte')
export class PlanoCorte {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  fornecedor_id: number

  @Column({ type: 'text', nullable: true })
  descricao: string

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  valor_total: number

  @Column({
    type: 'enum',
    enum: ['Rascunho', 'EmProducao', 'Finalizado', 'Cancelado'],
    default: 'Rascunho'
  })
  status: string

  @Column({ type: 'date', nullable: true })
  data_prevista: Date

  @OneToMany(() => ItemPlanoCorte, item => item.plano, {
    cascade: true
  })
  itens: ItemPlanoCorte[]

  @CreateDateColumn()
  created_at: Date
}

