import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn
} from 'typeorm'

@Entity('tarefas')
export class Tarefa {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ length: 150 })
  titulo: string

  @Column({ type: 'text', nullable: true })
  descricao: string

  @Column({ length: 50 })
  tipo: string
  // Ex: Cliente | PlanoCorte | Manutencao | Interna

  @Column({ default: true })
  ativa: boolean

  @CreateDateColumn()
  created_at: Date
}
