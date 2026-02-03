// src/producao/dto/atualizar-tarefa.dto.ts
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ArrayUnique,
} from 'class-validator'

export class AtualizarTarefaDto {
  // pode mudar vínculo se precisar (opcional)
  @IsOptional()
  @IsString()
  origem_tipo?: string

  @IsOptional()
  @IsInt()
  @Min(1)
  origem_id?: number

  // ✅ multi-funcionários (opcional)
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  funcionario_ids?: number[]

  // ✅ pipeline (opcional no update)
  @IsOptional()
  @IsString()
  etapa?: string

  @IsOptional()
  @IsString()
  status?: string

  @IsOptional()
  @IsString()
  observacao?: string

  // ✅ datas opcionais
  @IsOptional()
  @IsString()
  inicio_em?: string // ISO

  @IsOptional()
  @IsString()
  fim_em?: string // ISO
}
