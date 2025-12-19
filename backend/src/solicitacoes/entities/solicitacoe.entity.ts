import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('solicitacoes_cadastro')
export class SolicitacaoCadastro {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nome: string;

  @Column()
  email: string;

  @Column()
  usuario: string;

  @Column()
  senha: string;

  @Column({ default: 2 })
  nivel_acesso: number;

  @Column({ default: 'Pendente' })
  status: string;

  @CreateDateColumn()
  created_at: Date;
}