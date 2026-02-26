import {
  IsEmail,
  IsOptional,
  IsString,
  IsInt,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

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
  status?: string;

  /** Nova senha (apenas em edição). Se informada, será alterada. Mín. 6 caracteres. */
  @IsOptional()
  @IsString()
  @ValidateIf((_, v) => v != null && String(v).trim().length > 0)
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres' })
  senha?: string;

  /** Vincular este usuário a um funcionário. Null/0/vazio = desvincular. */
  @IsOptional()
  @Type(() => Number)
  @ValidateIf((_, v) => v != null && v !== '' && !Number.isNaN(Number(v)))
  @IsInt()
  @Min(1, { message: 'funcionario_id deve ser um ID válido' })
  funcionario_id?: number | null;
}
