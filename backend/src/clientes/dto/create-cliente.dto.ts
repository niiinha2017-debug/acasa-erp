// backend/src/clientes/dto/create-cliente.dto.ts

import { IsString, IsOptional, IsNotEmpty, IsEmail } from 'class-validator';

export class CreateClienteDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsString()
  @IsOptional()
  indicacao?: string;

  @IsString()
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  telefone?: string;

  @IsString()
  @IsOptional()
  cep?: string;

  @IsString()
  @IsOptional()
  endereco?: string;

  @IsString()
  @IsOptional()
  numero?: string;

  @IsString()
  @IsOptional()
  complemento?: string;

  @IsString()
  @IsOptional()
  bairro?: string;

  @IsString()
  @IsOptional()
  cidade?: string;

  @IsString()
  @IsOptional()
  estado?: string; // Limitar a 2 caracteres no frontend/backend

  @IsString()
  @IsOptional()
  cpf_cnpj?: string;

  @IsString()
  @IsOptional()
  rg_ie?: string;

  @IsString()
  @IsOptional()
  observacao?: string;
  
  // Status tem default 'Ativo' no MySQL, mas é bom receber
  @IsString()
  @IsOptional()
  status?: string; 
}
