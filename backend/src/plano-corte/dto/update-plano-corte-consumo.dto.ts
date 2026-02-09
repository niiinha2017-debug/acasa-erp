import { PartialType } from '@nestjs/mapped-types';
import { CreatePlanoCorteConsumoDto } from './create-plano-corte-consumo.dto';

export class UpdatePlanoCorteConsumoDto extends PartialType(
  CreatePlanoCorteConsumoDto,
) {}
