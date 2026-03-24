import { PartialType } from '@nestjs/mapped-types';
import { CreatePlanoCorteProjetoPecaDto } from './create-plano-corte-projeto.dto';

export class UpdatePecaDto extends PartialType(CreatePlanoCorteProjetoPecaDto) {}
