import { PartialType } from '@nestjs/mapped-types';
import { CriarClienteDto } from './criar-cliente.dto';

export class AtualizarClienteDto extends PartialType(CriarClienteDto) {}
