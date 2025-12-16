import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany
} from 'typeorm'
import { AmbienteVenda } from './ambiente-venda.entity'

@Entity('vendas')
export class Venda {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  cliente_id: number

  @Column({
    type: 'enum',
    enum: ['Orcamento', 'Venda'],
    default: 'Orcamento',
  })
  tipo: 'Orcamento' | 'Venda'

  @Column({
    type: 'enum',
    enum: ['Rascunho', 'Enviado', 'Aprovado', 'Cancelado'],
    default: 'Rascunho',
  })
  status: string

  @Column({ type: 'text', nullable: true })
  descricao_geral: string

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  valor_total: number

  @Column({ type: 'int', default: 7 })
  validade_dias: number

  @Column({ length: 100, nullable: true })
  prazo_entrega: string

  @OneToMany(() => AmbienteVenda, a => a.venda, { cascade: true })
  ambientes: AmbienteVenda[]

  @CreateDateColumn()
  created_at: Date
}
