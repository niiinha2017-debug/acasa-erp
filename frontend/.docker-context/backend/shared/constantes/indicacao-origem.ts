export const INDICACAO_ORIGENS = [
  { key: 'EMAIL', label: 'E-mail' },
  { key: 'INSTAGRAM', label: 'Instagram' },
  { key: 'FACEBOOK', label: 'Facebook' },
  { key: 'LOJA_FISICA', label: 'Loja Física' },
] as const;

export const INDICACAO_ORIGEM_KEYS = INDICACAO_ORIGENS.map((o) => o.key);
