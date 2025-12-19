import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 120 })
  name: string; // Este é o nome completo

  @Column({ length: 120, unique: true })
  usuario: string; // ✅ Faltava declarar este campo aqui

  @Column({ length: 120, unique: true })
  email: string;

  @Column()
  password: string;

// No seu src/users/user.entity.ts

@Column({ type: 'varchar', length: 255, nullable: true })
resetPasswordToken?: string | null; // Forçamos o tipo 'varchar' para o MySQL

@Column({ type: 'datetime', nullable: true })
resetPasswordExpires?: Date | null; // Forçamos o tipo 'datetime' para o MySQL

  @Column({
    type: 'enum',
    enum: ['admin', 'user'],
    default: 'user',
  })
  role: 'admin' | 'user';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}