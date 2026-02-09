import { IsOptional, IsString } from 'class-validator';

export class BuscarProdutoDto {
  @IsOptional()
  @IsString()
  nome_produto?: string;

  @IsOptional()
  @IsString()
  marca?: string;

  @IsOptional()
  @IsString()
  cor?: string;

  @IsOptional()
  @IsString()
  medida?: string;

  @IsOptional()
  fornecedor_id?: string | number;
}
