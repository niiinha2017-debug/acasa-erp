import { PrismaClient } from '@prisma/client';
import { config as loadEnv } from 'dotenv';
import {
  SUBETAPA_CATALOGO_POR_KEY,
  normalizarExecucaoEtapa,
  normalizarSubetapa,
  type Subetapa,
} from '../shared/constantes/status-matrix';

loadEnv({ path: '.env' });

const prisma = new PrismaClient();

type RegistroAgenda = {
  id: number;
  titulo: string;
  subetapa: string | null;
  categoria: string | null;
  status: string | null;
  execucao_etapa?: string | null;
  macroetapa?: string | null;
  fluxo_tipo?: string | null;
  plano_corte_id?: number | null;
  cliente: { nome_completo: string | null; razao_social: string | null } | null;
  fornecedor?: { nome_fantasia: string | null } | null;
  venda?: {
    cliente: { nome_completo: string | null; razao_social: string | null } | null;
  } | null;
};

function normalizarKey(valor?: string | null): string {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
}

function tituloPareceLegado(titulo?: string | null): boolean {
  const raw = String(titulo || '').trim();
  if (!raw) return true;
  const key = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const base = key.split(/[\u2013-]/)[0]?.trim() || key;
  if (/^agenda[_\s-]/i.test(base)) return true;
  return /^[A-Z0-9_]+$/i.test(base) && base.includes('_');
}

function subetapaPorCategoria(categoria?: string | null): Subetapa | null {
  const key = normalizarKey(categoria);
  const subetapaDireta = normalizarSubetapa(key);
  if (subetapaDireta) return subetapaDireta;
  const alias: Record<string, Subetapa> = {
    ATIVO: 'CADASTRO',
    CLIENTE_CADASTRADO: 'CADASTRO',
    AGENDAR_MEDIDA: 'MEDIDA',
    AGENDAR_MEDIDA_VENDA: 'MEDIDA',
    AGENDA_MEDIDA: 'MEDIDA',
    MEDIDA_AGENDADA: 'MEDIDA',
    MEDIDA_REALIZADA: 'MEDIDA',
    CRIAR_ORCAMENTO: 'ORCAMENTO',
    AGENDAR_ORCAMENTO: 'ORCAMENTO',
    ORCAMENTO_EM_ANDAMENTO: 'ORCAMENTO',
    AGENDAR_APRESENTACAO: 'APRESENTACAO',
    APRESENTACAO_AGENDADA: 'APRESENTACAO',
    AGENDAR_FECHAMENTO: 'FECHAMENTO',
    CONTRATO: 'FECHAMENTO',
    CONTRATO_GERADO: 'FECHAMENTO',
    CONTRATO_ASSINADO: 'FECHAMENTO',
    VENDA_FECHADA: 'FECHAMENTO',
    AGENDAR_MEDIDA_FINA: 'MEDIDA_FINA',
    MEDIDA_FINA: 'MEDIDA_FINA',
    AGUARDANDO_PROJETO_TECNICO: 'PROJETO_TECNICO',
    PROJETO_TECNICO_EM_ANDAMENTO: 'PROJETO_TECNICO',
    PROJETO_TECNICO_CONCLUIDO: 'PROJETO_TECNICO',
    PRODUCAO_RECEBIDA: 'PRODUCAO',
    PRODUCAO_EM_ANDAMENTO: 'PRODUCAO',
    PRODUCAO_FINALIZADA: 'PRODUCAO',
    MONTAGEM_CLIENTE_AGENDADA: 'MONTAGEM',
    EM_MONTAGEM_CLIENTE: 'MONTAGEM',
    MONTAGEM_CLIENTE_FINALIZADA: 'MONTAGEM',
    AGENDAR_POS_VENDA: 'GARANTIA',
    GARANTIA: 'GARANTIA',
    ASSISTENCIA: 'ASSISTENCIA',
    MANUTENCAO: 'MANUTENCAO',
    SERVICO_CORTE_FITA_BORDA: 'SERVICO_CORTE_FITA_BORDA',
    ENTREGA: 'ENTREGA',
  };
  return alias[key] || null;
}

function labelSubetapa(subetapa?: string | null): string {
  const subetapaNorm = normalizarSubetapa(subetapa) || subetapaPorCategoria(subetapa);
  if (subetapaNorm) return SUBETAPA_CATALOGO_POR_KEY[subetapaNorm]?.label || 'Agendamento';
  return 'Agendamento';
}

function subetapaPreferida(registro: RegistroAgenda): Subetapa | null {
  const atual = normalizarSubetapa(registro.subetapa);
  const derivadaDaCategoria = subetapaPorCategoria(registro.categoria);
  return derivadaDaCategoria || atual || null;
}

function execucaoPreferida(status?: string | null, atual?: string | null) {
  const statusKey = normalizarKey(status);
  const execucaoAtual = normalizarExecucaoEtapa(atual);
  if (statusKey === 'CONCLUIDO') return 'CONCLUIDO';
  if (['EM_PRODUCAO', 'EM_ANDAMENTO', 'PAUSADO'].includes(statusKey)) return 'EM_ANDAMENTO';
  if (statusKey === 'PENDENTE') return execucaoAtual === 'AGENDADO' ? 'AGENDADO' : 'PENDENTE';
  return execucaoAtual || 'PENDENTE';
}

function nomeReferencia(registro: RegistroAgenda): string {
  return (
    registro.cliente?.nome_completo ||
    registro.cliente?.razao_social ||
    registro.venda?.cliente?.nome_completo ||
    registro.venda?.cliente?.razao_social ||
    registro.fornecedor?.nome_fantasia ||
    ''
  ).trim();
}

function tituloCorrigido(registro: RegistroAgenda): string {
  const etapa = labelSubetapa(subetapaPreferida(registro) || registro.categoria);
  const nome = nomeReferencia(registro);
  return nome ? `${etapa} – ${nome}` : etapa;
}

async function corrigirAgendaLoja() {
  const registros = await prisma.agenda_loja.findMany({
    select: {
      id: true,
      titulo: true,
      subetapa: true,
      categoria: true,
      status: true,
      execucao_etapa: true,
      macroetapa: true,
      fluxo_tipo: true,
      cliente: { select: { nome_completo: true, razao_social: true } },
      venda: { select: { cliente: { select: { nome_completo: true, razao_social: true } } } },
      fornecedor: { select: { nome_fantasia: true } },
    },
  });

  let atualizados = 0;
  for (const registro of registros) {
    const subetapa = subetapaPreferida(registro);
    const catalogo = subetapa ? SUBETAPA_CATALOGO_POR_KEY[subetapa] : null;
    const precisaAjustarSubetapa = subetapa != null && subetapa !== normalizarSubetapa(registro.subetapa);
    const precisaAjustarTitulo = tituloPareceLegado(registro.titulo);
    if (!precisaAjustarTitulo && !precisaAjustarSubetapa) continue;
    const titulo = tituloCorrigido(registro);
    await prisma.agenda_loja.update({
      where: { id: registro.id },
      data: {
        titulo,
        ...(subetapa
          ? {
              subetapa,
              macroetapa: catalogo?.macroetapa,
              fluxo_tipo: catalogo?.fluxos?.[0] || registro.fluxo_tipo,
              execucao_etapa: execucaoPreferida(registro.status, registro.execucao_etapa),
            }
          : {}),
      },
    });
    atualizados += 1;
  }

  return { total: registros.length, atualizados };
}

async function corrigirAgendaFabrica() {
  const registros = await prisma.agenda_fabrica.findMany({
    select: {
      id: true,
      titulo: true,
      subetapa: true,
      categoria: true,
      status: true,
      execucao_etapa: true,
      macroetapa: true,
      fluxo_tipo: true,
      plano_corte_id: true,
      cliente: { select: { nome_completo: true, razao_social: true } },
      venda: { select: { cliente: { select: { nome_completo: true, razao_social: true } } } },
      fornecedor: { select: { nome_fantasia: true } },
    },
  });

  let atualizados = 0;
  for (const registro of registros) {
    // Agenda de serviço de corte: forçar subetapa correta independente da categoria legada
    const subetapa: Subetapa | null = registro.plano_corte_id != null
      ? 'SERVICO_CORTE_FITA_BORDA'
      : subetapaPreferida(registro);
    const catalogo = subetapa ? SUBETAPA_CATALOGO_POR_KEY[subetapa] : null;
    const precisaAjustarSubetapa = subetapa != null && subetapa !== normalizarSubetapa(registro.subetapa);
    const precisaAjustarTitulo = tituloPareceLegado(registro.titulo);
    if (!precisaAjustarTitulo && !precisaAjustarSubetapa) continue;
    const titulo = tituloCorrigido(registro);
    await prisma.agenda_fabrica.update({
      where: { id: registro.id },
      data: {
        titulo,
        ...(subetapa
          ? {
              subetapa,
              macroetapa: catalogo?.macroetapa,
              fluxo_tipo: catalogo?.fluxos?.[0] || registro.fluxo_tipo,
              execucao_etapa: execucaoPreferida(registro.status, registro.execucao_etapa),
            }
          : {}),
      },
    });
    atualizados += 1;
  }

  return { total: registros.length, atualizados };
}

async function main() {
  const loja = await corrigirAgendaLoja();
  const fabrica = await corrigirAgendaFabrica();

  console.log('Correcao de titulos da agenda concluida.');
  console.log(`Agenda loja: ${loja.atualizados} atualizados de ${loja.total}.`);
  console.log(`Agenda fabrica: ${fabrica.atualizados} atualizados de ${fabrica.total}.`);
}

main()
  .catch((error) => {
    console.error('Falha ao corrigir titulos legados da agenda.');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });