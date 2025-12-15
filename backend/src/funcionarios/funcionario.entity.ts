import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn
} from 'typeorm'

@Entity('funcionarios')
export class Funcionario {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ length: 150 })
  nome: string

  @Column({ length: 20, unique: true })
  cpf: string

  @Column({ type: 'date', nullable: true })
  nascimento: string

  @Column({ length: 20, nullable: true })
  sexo: string

  @Column({ length: 30, nullable: true })
  estado_civil: string

  @Column({ length: 150, nullable: true })
  email: string

  @Column({ length: 20, nullable: true })
  telefone: string

  @Column({ length: 10, nullable: true })
  cep: string

  @Column({ length: 200, nullable: true })
  endereco: string

  @Column({ length: 20, nullable: true })
  numero: string

  @Column({ length: 100, nullable: true })
  complemento: string

  @Column({ length: 100, nullable: true })
  bairro: string

  @Column({ length: 100, nullable: true })
  cidade: string

  @Column({ length: 2, nullable: true })
  estado: string

  @Column({ length: 50, nullable: true })
  setor: string

  @Column({ length: 50, nullable: true })
  funcao: string

  @Column({ length: 50, nullable: true })
  tipo_contrato: string

  @Column({ type: 'date', nullable: true })
  data_admissao: string

  @Column({ type: 'int', nullable: true })
  carga_horaria: number

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  salario_base: number

  @Column({ length: 50, nullable: true })
  forma_pagamento: string

  @Column({ length: 100, nullable: true })
  chave_pix: string

  @Column({ length: 20, default: 'Ativo' })
  status: string

  @CreateDateColumn()
  created_at: Date
}
