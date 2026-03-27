import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { FUNCIONARIO_STATUS_TRANSICOES } from '../../shared/constantes/tabelas-impostos';

const todosOsStatus = Object.keys(FUNCIONARIO_STATUS_TRANSICOES);

export class AtualizarStatusFuncionarioDto {
  @IsString()
  @IsIn(todosOsStatus, {
    message: `Status inválido. Use: ${todosOsStatus.join(', ')}`,
  })
  status: string;

  /** Motivo ou observação (obrigatório em alguns fluxos como AFASTADO, INATIVO, AVISO_PREVIO). */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  motivo?: string;

  /** Data de referência (ISO 8601: '2025-03-01'). Default: hoje. */
  @IsOptional()
  @IsString()
  data_referencia?: string;
}
