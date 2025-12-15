import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity('itens_compra')
export class ItemCompra {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  compra_id: number

  @Column()
  produto_id: number

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  quantidade: number

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor_unitario: number

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor_total: number

  @Column({ length: 20, nullable: true })
  unidade_compra: string
}
