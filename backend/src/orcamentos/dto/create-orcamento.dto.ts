import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class CreateOrcamentoDto {
  @Type(() => Number)
  @IsInt()
  cliente_id: number;
}
