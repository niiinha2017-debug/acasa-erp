import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUsuarioDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => String(value ?? '').trim())
  nome: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) =>
    String(value ?? '')
      .trim()
      .toLowerCase(),
  )
  usuario: string;

  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) =>
    String(value ?? '')
      .trim()
      .toLowerCase(),
  )
  email: string;

  @IsString()
  @IsOptional()
  @MinLength(6)
  @Transform(({ value }) => {
    const senha = String(value ?? '').trim();
    return senha || undefined;
  })
  senha?: string;
}
