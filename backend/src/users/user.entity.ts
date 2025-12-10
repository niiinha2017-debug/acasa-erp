// src/users/user.entity.ts

import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('users') // Opcional: define o nome da tabela no banco
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  // A senha deve ser criptografada antes de ser salva,
  // mas aqui definimos a coluna que irá armazená-la.
  @Column()
  password: string;

  // Você pode adicionar mais campos como email, nome, etc.
}