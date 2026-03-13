import { IsEnum } from 'class-validator';

const STRATEGIES = ['MIN_PRICE', 'AVG_PRICE', 'MAX_PRICE'] as const;
type SearchStrategy = (typeof STRATEGIES)[number];

export class UpdateSearchStrategyDto {
  @IsEnum(STRATEGIES)
  search_strategy: SearchStrategy;
}
