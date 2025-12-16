import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm'
import { OrcamentoAmbiente } from './orcamento-ambiente.entity'

@Entity('orcamentos')
export class Orcamento {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  cliente_nome: string

  @Column({ nullable: true })
  cliente_endereco: string

  @Column({ nullable: true })
  cliente_contato: string

  @Column({ type: 'date' })
  data_orcamento: string

  @Column({ default: 7 })
  validade_dias: number

  @Column({ type: 'text', nullable: true })
  condicoes_pagamento: string

  @Column({ type: 'text', nullable: true })
  prazo_entrega: string

  @Column({ type: 'text', nullable: true })
  observacoes: string

  @OneToMany(() => OrcamentoAmbiente, a => a.orcamento, {
    cascade: true
  })
  ambientes: OrcamentoAmbiente[]

  @CreateDateColumn()
  criado_em: Date

  @UpdateDateColumn()
  atualizado_em: Date
}
