import { IsString, MinLength } from 'class-validator'

export class AlterarSenhaDto {
  @IsString()
  senha_atual: string

  @IsString()
  @MinLength(6)
  senha_nova: string
}
