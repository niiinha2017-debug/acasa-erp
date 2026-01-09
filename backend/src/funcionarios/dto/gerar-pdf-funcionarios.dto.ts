import { ArrayNotEmpty, IsArray, IsInt } from 'class-validator'
import { Type } from 'class-transformer'

export class GerarPdfFuncionariosDto {
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @IsInt({ each: true })
  ids: number[]
}
