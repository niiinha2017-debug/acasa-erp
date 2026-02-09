import { PartialType } from '@nestjs/mapped-types';
import { CreatePlanoCorteItemDto } from './create-plano-corte-iten.dto';

export class UpdatePlanoCorteItemDto extends PartialType(
  CreatePlanoCorteItemDto,
) {}
