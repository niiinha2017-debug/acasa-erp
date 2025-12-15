import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn
} from 'typeorm'

@Entity('produtos')
export class Produto {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ length: 150 })
  nome: string

  @Column({ length: 150, nullable: true })
  fornecedor: string

  @Column({ length: 50, nullable: true })
  medida: string

  @Column({ length: 50, nullable: true })
  cor: string

  @Column({ length: 20, nullable: true })
  unidade: string

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  quantidade: number

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  valor_unitario: number

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  valor_total: number

  @CreateDateColumn()
  created_at: Date
}
