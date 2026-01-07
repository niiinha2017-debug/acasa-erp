import { PartialType } from '@nestjs/mapped-types';
import { CreatePlanoCorteDto } from './create-plano-corte.dto';

export class UpdatePlanoCorteDto extends PartialType(CreatePlanoCorteDto) {}
