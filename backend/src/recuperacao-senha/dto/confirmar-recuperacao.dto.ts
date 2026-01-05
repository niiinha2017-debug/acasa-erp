import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ConfirmarRecuperacaoDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @MinLength(6)
  senha_nova: string;
}
