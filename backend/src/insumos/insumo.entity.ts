import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm'

@Entity('insumos')
export class Insumo {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ length: 150 })
  nome: string

  @Column({ length: 50 })
  unidade: string // Ex: METRO, UNIDADE, KG

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  estoque_atual: number

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  custo_medio: number

  @Column({ default: 'Ativo' })
  status: string

  @CreateDateColumn()
  created_at: Date
}
