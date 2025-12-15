import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn
} from 'typeorm'

@Entity('fornecedores')
export class Fornecedor {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ length: 150 })
  nome_fantasia: string

  @Column({ length: 150, nullable: true })
  razao_social: string

  @Column({ length: 20, unique: true, nullable: true })
  cpf_cnpj: string

  @Column({ length: 30, nullable: true })
  inscricao_estadual: string

  @Column({ length: 20, nullable: true })
  telefone_loja: string

  @Column({ length: 150, nullable: true })
  email_loja: string

  @Column({ length: 100, nullable: true })
  vendedor_nome: string

  @Column({ length: 100, nullable: true })
  vendedor_contato: string

  @Column({ length: 10, nullable: true })
  cep: string

  @Column({ length: 255, nullable: true })
  endereco: string

  @Column({ length: 20, nullable: true })
  numero: string

  @Column({ length: 100, nullable: true })
  bairro: string

  @Column({ length: 100, nullable: true })
  cidade: string

  @Column({ length: 2, nullable: true })
  estado: string

  @Column({ type: 'int', nullable: true })
  dia_fechamento: number

  @Column({ type: 'int', nullable: true })
  dia_vencimento: number

  @Column({ length: 100, nullable: true })
  chave_pix: string

  @Column({ type: 'text', nullable: true })
  dados_bancarios: string

  @Column({ type: 'text', nullable: true })
  observacao: string

  @Column({ length: 20, default: 'Ativo' })
  status: string

  @CreateDateColumn()
  created_at: Date
}
