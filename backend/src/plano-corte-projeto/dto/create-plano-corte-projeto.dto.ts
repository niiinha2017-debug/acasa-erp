import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Validate,
  ValidateNested,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Type } from 'class-transformer';

@ValidatorConstraint({ name: 'medidasPecaComFitaValidas', async: false })
class MedidasPecaComFitaValidasConstraint implements ValidatorConstraintInterface {
  validate(_: unknown, args: any) {
    const peca = args?.object || {};
    const larguraNominal = Number(peca.largura_nominal_mm || 0);
    const alturaNominal = Number(peca.altura_nominal_mm || 0);
    const fitaEsquerda = Number(peca.fita_esquerda_mm || 0);
    const fitaDireita = Number(peca.fita_direita_mm || 0);
    const fitaTopo = Number(peca.fita_topo_mm || 0);
    const fitaBase = Number(peca.fita_base_mm || 0);

    const larguraCorte = larguraNominal - fitaEsquerda - fitaDireita;
    const alturaCorte = alturaNominal - fitaTopo - fitaBase;
    return larguraCorte > 0 && alturaCorte > 0;
  }

  defaultMessage() {
    return 'Medidas inválidas: largura/altura nominal menos fitas deve resultar em valor positivo.';
  }
}

export class CreatePlanoCorteProjetoPecaDto {
  @IsString()
  nome: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  largura_nominal_mm: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  altura_nominal_mm: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantidade: number;

  @IsBoolean()
  girar_peca: boolean;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  fita_topo_mm: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  fita_base_mm: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  fita_esquerda_mm: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  fita_direita_mm: number;

  @Validate(MedidasPecaComFitaValidasConstraint)
  medidas_validas: boolean;
}

export class CreatePlanoCorteProjetoChapaDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  produto_id?: number;

  @IsOptional()
  @IsString()
  codigo?: string;

  @IsOptional()
  @IsString()
  material?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  largura_mm: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  altura_mm: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantidade: number;
}

export class CreatePlanoCorteProjetoDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  plano_corte_id?: number;

  @IsString()
  nome: string;

  @IsOptional()
  @IsString()
  material?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  espessura_mm?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  kerf_mm: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePlanoCorteProjetoPecaDto)
  pecas: CreatePlanoCorteProjetoPecaDto[];

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePlanoCorteProjetoChapaDto)
  chapas: CreatePlanoCorteProjetoChapaDto[];
}
