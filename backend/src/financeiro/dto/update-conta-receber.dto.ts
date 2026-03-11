import { PartialType } from '@nestjs/mapped-types';
import { CreateContaReceberDto } from './create-conta-receber.dto';

export class UpdateContaReceberDto extends PartialType(CreateContaReceberDto) {}
