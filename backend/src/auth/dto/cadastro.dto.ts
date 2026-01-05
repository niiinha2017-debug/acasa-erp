import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CadastroDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsString()
  @IsNotEmpty()
  usuario: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  setor: string;

  @IsString()
  @IsNotEmpty()
  funcao: string;

@IsString()
@IsNotEmpty()
@MinLength(6)
senha: string;

  @IsString()
  @IsNotEmpty()
  status: string;
}
