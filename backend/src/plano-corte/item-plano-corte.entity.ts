import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn
} from 'typeorm'
import { PlanoCorte } from './plano-corte.entity'

@Entity('itens_plano_corte')
export class ItemPlanoCorte {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  plano_corte_id: number

  @Column({ length: 255 })
  descricao: string

  @Column({ length: 20 })
  unidade: string

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  quantidade: number

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor_unitario: number

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor_total: number

  @ManyToOne(() => PlanoCorte, plano => plano.itens)
  plano: PlanoCorte

  @CreateDateColumn()
  created_at: Date
}
