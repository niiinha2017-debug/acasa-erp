/**
 * Re-exporta pipeline cliente do shared (fonte única).
 * Services e frontend consomem daqui; a definição fica em shared/constantes.
 */
export {
  PIPELINE_CLIENTE_FASES,
  PIPELINE_CLIENTE,
  PIPELINE_CLIENTE_KEYS,
  STATUS_POS_VENDA,
  normalizarStatusCliente,
  statusClienteEhValido,
  validarTransicaoStatusCliente,
} from '../../../shared/constantes/pipeline-cliente';
