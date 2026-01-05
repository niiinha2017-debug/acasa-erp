import { IsEmail, IsOptional, IsString } from 'class-validator';

export class AtualizarUsuarioDto {
  @IsString()
  @IsOptional()
  nome?: string;

  @IsString()
  @IsOptional()
  usuario?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  setor?: string;

  @IsString()
  @IsOptional()
  funcao?: string;

  @IsString()
  @IsOptional()
  status?: string;
}
