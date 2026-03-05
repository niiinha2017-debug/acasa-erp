import {
  IsEmail,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CriarFuncionarioDto {
  // Dados pessoais
  @IsString()
  nome: string;

  @IsString()
  cpf: string;

  @IsOptional()
  @IsString()
  rg?: string;

  @IsOptional()
  @IsString()
  pis?: string;

  @IsOptional()
  @IsString()
  data_nascimento?: string;

  @IsOptional()
  @IsString()
  telefone?: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  estado_civil?: string;

  @IsOptional()
  @IsString()
  escolaridade?: string;

  /** Criar usuário de acesso e enviar senha provisória por e-mail (quando e-mail estiver preenchido). Default true. */
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  criar_usuario?: boolean;

  // Empresa
  @IsOptional()
  @IsString()
  unidade?: string;

  @IsOptional()
  @IsString()
  setor?: string;

  @IsOptional()
  @IsString()
  cargo?: string;

  @IsOptional()
  @IsString()
  funcao?: string;

  // Endereço
  @IsOptional()
  @IsString()
  cep?: string;

  @IsOptional()
  @IsString()
  endereco?: string;

  @IsOptional()
  @IsString()
  numero?: string;

  @IsOptional()
  @IsString()
  complemento?: string; // <--- ADICIONADO PARA O NOVO CAMPO

  @IsOptional()
  @IsString()
  bairro?: string;

  @IsOptional()
  @IsString()
  cidade?: string;

  @IsOptional()
  @IsString()
  estado?: string;

  // Registro / vínculo
  @IsOptional()
  @IsString()
  registro?: string;

  @IsOptional()
  @IsString()
  data_inicio?: string;

  @IsOptional()
  @IsString()
  admissao?: string;

  @IsOptional()
  @IsString()
  demissao?: string;

  // Financeiro
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  salario_base?: number;

  /** Percentual de impostos/encargos sobre o salário (ex: 28 para 28%). Usado no cálculo do Custo Total Mensal. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  impostos_encargos_percentual?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  salario_adicional?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  custo_hora?: number;

  // Vale Alimentação / Refeição
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  tem_vale?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  vale?: number;

  // Vale Transporte
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  tem_vale_transporte?: boolean; // <--- ADICIONADO PARA O CHECKBOX

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  vale_transporte?: number; // <--- ADICIONADO PARA O VALOR DO VT

  // Horários (4 horários)
  @IsOptional()
  @IsString()
  horario_entrada_1?: string;

  @IsOptional()
  @IsString()
  horario_saida_1?: string;

  @IsOptional()
  @IsString()
  horario_entrada_2?: string;

  @IsOptional()
  @IsString()
  horario_saida_2?: string;

  @IsOptional()
  @IsString()
  horario_sabado_entrada_1?: string;

  @IsOptional()
  @IsString()
  horario_sabado_saida_1?: string;

  // Carga horária
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  carga_horaria_dia?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  carga_horaria_semana?: number;

  // Pagamento
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  dia_pagamento?: number;

  @IsOptional()
  @IsString()
  forma_pagamento?: string;

  @IsOptional()
  @IsString()
  banco?: string;

  @IsOptional()
  @IsString()
  agencia?: string;

  @IsOptional()
  @IsString()
  conta?: string;

  @IsOptional()
  @IsString()
  pix_tipo_chave?: string;

  @IsOptional()
  @IsString()
  pix_chave?: string;
}
