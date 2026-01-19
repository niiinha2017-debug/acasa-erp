// src/producao/dto/atualizar-tarefa.dto.ts
import { IsInt, IsOptional, IsString, Min } from 'class-validator'

export class AtualizarTarefaDto {
  // pode mudar vínculo se precisar (opcional)
  @IsOptional()
  @IsString()
  origem_tipo?: string

  @IsOptional()
  @IsInt()
  @Min(1)
  origem_id?: number

  @IsOptional()
  @IsInt()
  @Min(1)
  funcionario_id?: number

  @IsOptional()
  @IsString()
  titulo?: string

  @IsOptional()
  @IsString()
  status?: string

  @IsOptional()
  @IsString()
  observacao?: string

  @IsOptional()
  @IsString()
  inicio_em?: string // ISO

  @IsOptional()
  @IsString()
  fim_em?: string // ISO
}
