import { PartialType } from '@nestjs/mapped-types';
import { CreateMedicaoFinaDto } from './create-medicao-fina.dto';

export class UpdateMedicaoFinaDto extends PartialType(CreateMedicaoFinaDto) {}
