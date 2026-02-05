import { IsNotEmpty, IsString, MinLength } from 'class-validator'

export class AlterarSenhaDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1) // opcional, só pra garantir não vazio
  senha_atual: string

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  senha_nova: string
}
