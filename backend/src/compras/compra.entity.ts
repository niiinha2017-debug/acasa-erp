import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn
} from 'typeorm'

@Entity('compras')
export class Compra {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  fornecedor_id: number

  @Column()
  venda_id: number   // 🔴 COMPRA NASCE DA VENDA

  @Column({ type: 'date' })
  data_compra: string

  @Column({ type: 'date', nullable: true })
  data_emissao_nf: string

  @Column({ length: 50, nullable: true })
  numero_nf: string

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  valor_total_produtos: number

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  valor_frete: number

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  valor_outros: number

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor_final: number

  @Column({ length: 20, default: 'Pendente' })
  status: string

  @Column({ type: 'text', nullable: true })
  observacao: string

  @CreateDateColumn()
  created_at: Date
}
