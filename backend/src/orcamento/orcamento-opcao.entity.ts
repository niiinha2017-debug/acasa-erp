import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne
} from 'typeorm'
import { OrcamentoAmbiente } from './orcamento-ambiente.entity'

@Entity('orcamento_opcoes')
export class OrcamentoOpcao {
  @PrimaryGeneratedColumn()
  id: number

  @ManyToOne(() => OrcamentoAmbiente, a => a.opcoes, {
    onDelete: 'CASCADE'
  })
  ambiente: OrcamentoAmbiente

  @Column()
  titulo: string

  @Column({ type: 'text' })
  descritivo: string

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor: number

  @Column({ default: 0 })
  ordem: number
}
