import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm'

import { PlanoCorte } from './plano-corte.entity'

@Entity('insumos_plano_corte')
export class InsumoPlanoCorte {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  plano_corte_id: number

  @Column()
  produto_id: number

  @Column({ length: 20 })
  unidade: string

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  quantidade: number

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  custo_unitario: number

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  custo_total: number
}


