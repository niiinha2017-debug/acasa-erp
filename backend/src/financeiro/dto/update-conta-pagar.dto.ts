import { PartialType } from '@nestjs/mapped-types';
import { CreateContaPagarDto } from './create-conta-pagar.dto';

export class UpdateContaPagarDto extends PartialType(CreateContaPagarDto) {}
