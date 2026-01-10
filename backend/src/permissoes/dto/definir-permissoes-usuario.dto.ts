import { IsArray, IsString } from 'class-validator'

export class DefinirPermissoesUsuarioDto {
  @IsArray()
  @IsString({ each: true })
  permissoes: string[]
}
