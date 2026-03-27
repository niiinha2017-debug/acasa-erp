import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class ConfirmarImportacaoLeituraDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}/, {
    message: 'data_entrega_prevista deve começar com YYYY-MM-DD (ISO).',
  })
  data_entrega_prevista?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  valor_bruto?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  valor_impostos_nf?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  valor_comissao?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  valor_taxas_cartao?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  valor_taxas_processamento_cartao?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  valor_taxas_antecipacao_credito?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  valor_liquido?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  taxa_nota_percentual?: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  tem_nota_fiscal?: boolean;

  /**
   * Objeto livre: chave = papel (VENDEDOR, ARQUITETO, PROJETISTA),
   * valor = { nome, percentual }. Usa @Transform para preservar o
   * objeto inteiro sem que o whitelist remova os campos internos.
   */
  @IsOptional()
  @Transform(({ value }) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
    const sanitized: Record<string, { nome: string; percentual: number }> = {};
    for (const [key, v] of Object.entries(value)) {
      if (!v || typeof v !== 'object') continue;
      const item = v as any;
      const nome = typeof item.nome === 'string' ? item.nome.trim() : '';
      const percentual = Number.isFinite(Number(item.percentual)) ? Number(item.percentual) : 0;
      if (nome) sanitized[String(key).trim().toUpperCase()] = { nome, percentual };
    }
    return Object.keys(sanitized).length > 0 ? sanitized : undefined;
  })
  comissionados?: Record<string, { nome: string; percentual: number }>;

  @IsOptional()
  @Transform(({ value }) => {
    if (!Array.isArray(value)) return undefined;
    return value
      .filter((p: any) => p && typeof p === 'object')
      .map((p: any) => ({
        valor: Number.isFinite(Number(p.valor)) ? Number(p.valor) : 0,
        vencimento: typeof p.vencimento === 'string' && p.vencimento.trim() ? p.vencimento.trim() : null,
        forma: typeof p.forma === 'string' && p.forma.trim() ? p.forma.trim().toUpperCase() : null,
        descricao: typeof p.descricao === 'string' ? p.descricao.slice(0, 500) : null,
      }));
  })
  parcelas?: Array<{
    valor: number;
    vencimento?: string | null;
    forma?: string | null;
    descricao?: string | null;
  }>;
}
