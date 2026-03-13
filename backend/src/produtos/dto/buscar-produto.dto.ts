import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TipoAplicacaoProduto } from './criar-produto.dto';

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

  @IsOptional()
  @IsEnum(TipoAplicacaoProduto)
  tipo_aplicacao?: TipoAplicacaoProduto;
}
