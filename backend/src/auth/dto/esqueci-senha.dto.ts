import { IsEmail, IsString } from 'class-validator';

export class EsqueciSenhaDto {
  @IsString()
  @IsEmail()
  email: string;
}
