import { IsArray, IsInt } from 'class-validator';

export class DefinirPermissoesUsuarioDto {
  @IsArray()
  @IsInt({ each: true })
  permissoes: number[];
}
