// src/producao/dto/criar-tarefa.dto.ts
import { IsInt, IsOptional, IsString, Min } from 'class-validator'

export class CriarTarefaDto {
  @IsString()
  origem_tipo: string

  @IsInt()
  @Min(1)
  origem_id: number

  @IsInt()
  @Min(1)
  funcionario_id: number

  @IsString()
  titulo: string

  @IsOptional()
  @IsString()
  status?: string

  @IsOptional()
  @IsString()
  observacao?: string

  @IsString()
  inicio_em: string // ISO

  @IsString()
  fim_em: string // ISO
}
