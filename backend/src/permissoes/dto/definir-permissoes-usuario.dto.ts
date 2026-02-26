import { IsArray, IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class DefinirPermissoesUsuarioDto {
  @IsArray()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map((v) => parseInt(v, 10)).filter((n) => !Number.isNaN(n) && n >= 1)
      : [],
  )
  @IsInt({ each: true })
  @Min(1, { each: true })
  permissoes: number[];
}
