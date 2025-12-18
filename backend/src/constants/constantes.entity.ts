import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm'

@Entity('constantes')
export class Constante {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ length: 50 })
  grupo: string

  @Column({ length: 50 })
  codigo: string

  @Column({ length: 100 })
  label: string

  // STRING — NÃO OBJECT
  @Column({ type: 'varchar', length: 100, nullable: true })
  valor: string | null

  // JSON REAL
  @Column({ type: 'json', nullable: true })
  extra: Record<string, any> | null

  @Column({ type: 'tinyint', default: 1 })
  ativo: boolean

  @CreateDateColumn()
  created_at: Date
}
