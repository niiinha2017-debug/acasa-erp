import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('clientes')
export class Cliente {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  nome: string;

  @Column({ length: 150, nullable: true })
  indicacao?: string;

  @Column({ length: 150, nullable: true })
  email?: string;

  @Column({ length: 20, nullable: true })
  telefone?: string;

  @Column({ length: 10, nullable: true })
  cep?: string;

  @Column({ type: 'text', nullable: true })
  endereco?: string;

  @Column({ length: 20, nullable: true })
  numero?: string;

  @Column({ length: 100, nullable: true })
  complemento?: string;

  @Column({ length: 100, nullable: true })
  bairro?: string;

  @Column({ length: 100, nullable: true })
  cidade?: string;

  @Column({ length: 2, nullable: true })
  estado?: string;

  @Column({ length: 20, nullable: true, unique: true })
  cpf_cnpj?: string;

  @Column({ length: 30, nullable: true })
  rg_ie?: string;

  @Column({ type: 'text', nullable: true })
  observacao?: string;

  @Column({ length: 20, default: 'Ativo' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
