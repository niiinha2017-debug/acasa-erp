import { PartialType } from '@nestjs/mapped-types';
import { CriarFuncionarioDto } from './criar-funcionario.dto';

export class AtualizarFuncionarioDto extends PartialType(CriarFuncionarioDto) {}
