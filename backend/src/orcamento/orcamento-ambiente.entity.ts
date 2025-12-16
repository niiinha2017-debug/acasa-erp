import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany
} from 'typeorm'
import { Orcamento } from './orcamento.entity'
import { OrcamentoOpcao } from './orcamento-opcao.entity'

@Entity('orcamento_ambientes')
export class OrcamentoAmbiente {
  @PrimaryGeneratedColumn()
  id: number

  @ManyToOne(() => Orcamento, o => o.ambientes, {
    onDelete: 'CASCADE'
  })
  orcamento: Orcamento

  @Column()
  nome: string

  @Column({ default: 0 })
  ordem: number

  @OneToMany(() => OrcamentoOpcao, o => o.ambiente, {
    cascade: true
  })
  opcoes: OrcamentoOpcao[]
}
