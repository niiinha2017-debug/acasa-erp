import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne
} from 'typeorm'
import { AmbienteVenda } from './ambiente-venda.entity'

@Entity('itens_venda')
export class ItemVenda {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  venda_id: number

  @Column()
  ambiente_id: number

  @Column({ type: 'text' })
  descricao: string

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 1 })
  quantidade: number

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  valor_unitario: number

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  valor_total: number

  @ManyToOne(() => AmbienteVenda, ambiente => ambiente.itens)
  ambiente: AmbienteVenda
}
