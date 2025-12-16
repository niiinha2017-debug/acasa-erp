import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm'

@Entity('consumo_insumos')
export class ConsumoInsumo {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  insumo_id: number

  @Column({ nullable: true })
  plano_corte_id: number

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  quantidade: number

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  custo_unitario: number

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  custo_total: number

  @CreateDateColumn()
  created_at: Date
}
