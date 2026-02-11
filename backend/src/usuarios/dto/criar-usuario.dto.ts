import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CriarUsuarioDto {
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
  @MinLength(6)
  @IsOptional()
  senha: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  status: string;

  @IsBoolean()
  @IsOptional()
  enviar_senha_provisoria?: boolean;
}
