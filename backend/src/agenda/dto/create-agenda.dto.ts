import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsInt,
  IsArray,
  ArrayMinSize,
  ValidateIf,
} from 'class-validator';

export class CreateAgendaDto {
  @IsString()
  @IsNotEmpty({ message: 'O titulo do agendamento e obrigatorio' })
  titulo: string;

  @IsDateString({}, { message: 'Data de inicio invalida' })
  inicio_em: Date;

  @IsDateString({}, { message: 'Data de termino invalida' })
  fim_em: Date;

  @ValidateIf((o) => !o.plano_corte_id)
  @IsInt()
  @IsNotEmpty({ message: 'Cliente ou Plano de Corte e obrigatorio' })
  cliente_id?: number;

  @IsOptional()
  @IsInt()
  fornecedor_id?: number;

  @IsOptional()
  @IsInt()
  orcamento_id?: number;

  @IsOptional()
  @IsInt()
  venda_id?: number;

  @IsOptional()
  @IsInt()
  plano_corte_id?: number;

  @IsOptional()
  @IsInt()
  projeto_id?: number;

  @IsArray()
  @IsInt({ each: true })
  @ArrayMinSize(1, {
    message: 'Selecione pelo menos um funcionario para a equipe',
  })
  equipe_ids: number[];

  @IsOptional()
  @IsString()
  categoria?: string;

  @IsOptional()
  @IsString()
  origem_fluxo?: string; // CLIENTE | FORNECEDOR

  @IsOptional()
  @IsString()
  status?: string;
}
