import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany
} from 'typeorm'
import { Venda } from './venda.entity'
import { ItemVenda } from './item-venda.entity'

@Entity('ambientes_venda')
export class AmbienteVenda {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  venda_id: number

  @Column({ length: 100 })
  nome: string

  @Column({ type: 'text', nullable: true })
  descricao: string

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  valor_total: number

  @ManyToOne(() => Venda, venda => venda.ambientes)
  venda: Venda

  @OneToMany(() => ItemVenda, item => item.ambiente, { cascade: true })
  itens: ItemVenda[]
}
