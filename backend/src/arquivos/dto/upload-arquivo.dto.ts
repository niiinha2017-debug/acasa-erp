import { Type } from 'class-transformer'
import { IsInt, IsOptional, IsString } from 'class-validator'

export class UploadArquivoDto {
  @IsString()
  owner_type: string

  @Type(() => Number)
  @IsInt()
  owner_id: number

  @IsOptional()
  @IsString()
  categoria?: string

  @IsOptional()
  @IsString()
  slot_key?: string
}
