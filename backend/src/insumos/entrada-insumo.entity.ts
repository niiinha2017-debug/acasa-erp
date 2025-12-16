import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm'

@Entity('entrada_insumos')
export class EntradaInsumo {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  insumo_id: number

  @Column({
    type: 'enum',
    enum: ['Compra', 'PlanoCorte', 'Ajuste'],
  })
  origem: 'Compra' | 'PlanoCorte' | 'Ajuste'

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  quantidade: number

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor_unitario: number

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor_total: number

  @CreateDateColumn()
  created_at: Date
}
