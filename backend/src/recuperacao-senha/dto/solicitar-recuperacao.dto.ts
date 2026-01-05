import { IsEmail, IsNotEmpty } from 'class-validator';

export class SolicitarRecuperacaoDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
