import { PartialType } from '@nestjs/mapped-types';
import { CreateApontamentoProducaoDto } from './create-apontamento-producao.dto';

export class UpdateApontamentoProducaoDto extends PartialType(
  CreateApontamentoProducaoDto,
) {}
