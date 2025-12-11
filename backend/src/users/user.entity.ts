import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 120 })
  name: string;

  @Column({ length: 120, unique: true })
  email: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: ['admin', 'user'],
    default: 'user',
  })
  role: 'admin' | 'user';

  @Column({
    type: 'timestamp',
    name: 'created_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;
}
