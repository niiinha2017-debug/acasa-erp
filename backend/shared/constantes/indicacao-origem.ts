export const INDICACAO_ORIGENS = [
  { key: 'EMAIL', label: 'E-mail' },
  { key: 'INSTAGRAM', label: 'Instagram' },
  { key: 'FACEBOOK', label: 'Facebook' },
] as const;

export const INDICACAO_ORIGEM_KEYS = INDICACAO_ORIGENS.map((o) => o.key);
