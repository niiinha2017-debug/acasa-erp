  // src/utils/pdf/types.ts
  export type PdfPageSize = 'A4' | 'A5' | 'LETTER' | [number, number]

  export type EmpresaHeaderVariant = 'relatorio' | 'compacto' | 'etiqueta'

  export type EmpresaHeaderOptions = {
    variant?: EmpresaHeaderVariant
    title?: string
    showTitle?: boolean
    showGeneratedAt?: boolean

    // layout
    x?: number
    y?: number
    logoWidth?: number
    lineAfter?: boolean

    // controle fino (quando cada PDF tem um “topo” diferente)
    headerBottomY?: number // força um Y final (se quiser padronizar por tamanho)
  }
