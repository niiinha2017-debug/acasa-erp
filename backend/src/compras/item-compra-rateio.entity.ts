import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity('itens_compra_rateio')
export class ItemCompraRateio {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  item_compra_id: number

  @Column()
  ambiente_id: number  // ambiente da VENDA

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  percentual: number

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  valor_alocado: number
}
