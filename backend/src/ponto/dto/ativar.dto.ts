import { IsOptional, IsString, MaxLength } from 'class-validator'

export class AtivarDto {
  @IsString()
  @MaxLength(40)
  code: string

  @IsString()
  @MaxLength(80)
  device_uuid: string

  @IsOptional()
  @IsString()
  @MaxLength(120)
  device_nome?: string

  @IsOptional()
  @IsString()
  @MaxLength(20)
  plataforma?: string
}
