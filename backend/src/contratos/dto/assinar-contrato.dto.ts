export class AssinarContratoDto {
  /** Data/hora em que o contrato foi assinado (ISO string). Se omitido, usa a data atual. */
  data_assinatura?: string;
  /** Imagem da assinatura em base64 (ex.: data:image/png;base64,... ou só a parte após a vírgula). */
  assinatura_base64?: string;
}
