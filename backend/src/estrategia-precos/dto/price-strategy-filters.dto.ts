import { IsOptional, IsString } from 'class-validator';

export class PriceStrategyFiltersDto {
  @IsOptional()
  @IsString()
  categoria?: string;

  @IsOptional()
  @IsString()
  espessura?: string;

  @IsOptional()
  @IsString()
  grupo?: string;
}
