import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn
} from 'typeorm'

@Entity('agenda_producao')
export class AgendaProducao {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  data: Date

  @Column({ length: 100 })
  titulo: string

  @Column({ type: 'text', nullable: true })
  descricao: string

  @Column({ nullable: true })
  plano_corte_id: number

  @Column({ nullable: true })
  venda_id: number

  @Column({ default: 'Pendente' })
  status: string

  @CreateDateColumn()
  created_at: Date
}
