<template>
	<PageShell :padded="false">
		<section class="arquivos-list animate-page-in">
			<PageHeader
				title="Arquivos de Migração"
				subtitle="Selecione um cliente para gerenciar status e documentos de importação"
				icon="pi pi-folder-open"
			>
				<template #actions>
					<div class="arquivos-list__actions">
						<div class="arquivos-list__search">
							<SearchInput
								v-model="filtro"
								placeholder="Buscar cliente, documento, cidade ou status..."
							/>
						</div>

						<Button
							variant="secondary"
							class="arquivos-list__refresh"
							:loading="loading"
							@click="carregarClientes"
						>
							<i class="pi pi-refresh"></i>
							Recarregar
						</Button>
					</div>
				</template>
			</PageHeader>

			<div class="arquivos-list__content">
				<Table
					:columns="columns"
					:rows="rows"
					:loading="loading"
					empty-text="Nenhum cliente encontrado para importação."
					:boxed="false"
					:flush="false"
				>
					<template #cell-cliente="{ row }">
						<div class="arquivos-list__identity">
							<div class="arquivos-list__initials">
								{{ String(row.nome_exibicao || '?').substring(0, 2).toUpperCase() }}
							</div>
							<div class="arquivos-list__identity-copy">
								<span class="arquivos-list__primary">
									{{ row.nome_exibicao }}
								</span>
								<span class="arquivos-list__secondary">
									{{ row.documento || 'Sem documento' }}
									<span v-if="row.email" class="arquivos-list__secondary-detail">{{ row.email }}</span>
								</span>
							</div>
						</div>
					</template>

					<template #cell-contato="{ row }">
						<div class="arquivos-list__stack">
							<span class="arquivos-list__primary">{{ row.contato_principal }}</span>
							<span class="arquivos-list__secondary">{{ row.email || 'Sem e-mail' }}</span>
						</div>
					</template>

					<template #cell-local="{ row }">
						<div class="arquivos-list__stack">
							<span class="arquivos-list__primary">{{ row.local_resumo }}</span>
							<span class="arquivos-list__secondary">{{ row.endereco_resumo }}</span>
						</div>
					</template>

					<template #cell-status="{ row }">
						<span
							class="ds-status-pill"
							:class="row.status_class"
						>
							{{ row.status_label }}
						</span>
					</template>

					<template #cell-acoes="{ row }">
						<div class="ds-table-actions arquivos-list__actions-cell">
							<button
								type="button"
								class="ds-table-action arquivos-list__open-action"
								@click="abrirImportacao(row.id)"
								title="Abrir importação"
							>
								<i class="pi pi-arrow-right ds-table-action__icon"></i>
								<span>Abrir Importação</span>
							</button>
						</div>
					</template>
				</Table>
			</div>
		</section>
	</PageShell>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ClienteService } from '@/services'
import { notify } from '@/services/notify'
import { getStatusVendaOperacionalLabel } from '@/constantes'
import { normalizarStatusCliente } from '@/constantes/pipeline-cliente'

definePage({ meta: { perm: 'clientes.ver' } })

const route = useRoute()
const router = useRouter()

const filtro = ref(String(route.query.q || ''))
const loading = ref(false)
const clientes = ref([])

const columns = [
	{ key: 'cliente', label: 'CLIENTE', width: '28%' },
	{ key: 'contato', label: 'CONTATO', width: '24%' },
	{ key: 'local', label: 'LOCAL', width: '24%' },
	{ key: 'status', label: 'STATUS', width: '14%' },
	{ key: 'acoes', label: '', width: '12%', align: 'right' },
]

const filteredClients = computed(() => {
	const termo = String(filtro.value || '').toLowerCase().trim()
	if (!termo) return clientes.value

	const digits = onlyDigits(termo)
	return clientes.value.filter((cliente) => {
		const texto = [
			getClienteNome(cliente),
			cliente.email,
			cliente.whatsapp,
			cliente.telefone,
			cliente.endereco,
			cliente.numero,
			cliente.bairro,
			cliente.cidade,
			cliente.estado,
			getStatusLabel(cliente.status),
			normalizeStatusKey(cliente.status),
		]
			.filter(Boolean)
			.join(' ')
			.toLowerCase()

		if (texto.includes(termo)) return true
		if (!digits) return false

		return [cliente.cpf, cliente.cnpj, cliente.whatsapp, cliente.telefone]
			.map(onlyDigits)
			.some((valor) => valor.includes(digits))
	})
})

const clientesAtivos = computed(() =>
	filteredClients.value.filter((cliente) => !['ENCERRADO', 'GARANTIA', 'ASSISTENCIA', 'MANUTENCAO'].includes(normalizeStatusKey(cliente.status))),
)

const filtroResumo = computed(() => String(filtro.value || '').trim() || 'Sem filtro')

const rows = computed(() =>
	filteredClients.value.map((cliente) => ({
		...cliente,
		nome_exibicao: getClienteNome(cliente),
		documento: cliente.cpf || cliente.cnpj || '',
		contato_principal: cliente.whatsapp || cliente.telefone || 'Sem telefone',
		email: cliente.email || '',
		local_resumo: [cliente.cidade, cliente.estado].filter(Boolean).join(' / ') || 'Local não informado',
		endereco_resumo: [cliente.endereco, cliente.numero, cliente.bairro].filter(Boolean).join(', ') || 'Endereço não informado',
		status_label: getStatusLabel(cliente.status),
		status_class: getFluxoClass(cliente.status),
	})),
)

function onlyDigits(value) {
	return String(value || '').replace(/\D/g, '')
}

function normalizeStatusKey(value) {
	try {
		return String(normalizarStatusCliente(value || '') || '').toUpperCase()
	} catch {
		return String(value || '').trim().toUpperCase().replace(/\s+/g, '_')
	}
}

function getClienteNome(cliente) {
	return cliente?.nome_completo || cliente?.razao_social || cliente?.nome_fantasia || 'Cliente'
}

function getStatusLabel(status) {
	return getStatusVendaOperacionalLabel(normalizeStatusKey(status)) || 'Sem status'
}

function getFluxoClass(status) {
	const key = normalizeStatusKey(status)
	const mapa = {
		CLIENTE_CADASTRADO: 'ds-status-pill--neutral',
		MEDIDA_AGENDADA: 'ds-status-pill--warning',
		MEDIDA_REALIZADA: 'ds-status-pill--warning',
		ORCAMENTO_EM_ANDAMENTO: 'ds-status-pill--warning',
		ORCAMENTO_APROVADO: 'ds-status-pill--success',
		VENDA_FECHADA: 'ds-status-pill--success',
		MEDIDA_FINA_AGENDADA: 'ds-status-pill--warning',
		EM_PRODUCAO: 'ds-status-pill--warning',
		EM_MONTAGEM: 'ds-status-pill--warning',
		GARANTIA: 'ds-status-pill--warning',
		ENCERRADO: 'ds-status-pill--neutral',
	}
	return mapa[key] || 'ds-status-pill--neutral'
}

async function carregarClientes() {
	loading.value = true
	try {
		const { data } = await ClienteService.listar()
		clientes.value = Array.isArray(data) ? data : []
	} catch (error) {
		console.error('Erro ao carregar indice de importacao:', error)
		notify.error('Falha ao carregar a lista de clientes.')
		clientes.value = []
	} finally {
		loading.value = false
	}
}

function abrirImportacao(clienteId) {
	const cleanId = Number(clienteId)
	if (!cleanId) return
	router.push(`/arquivos/importacao/${cleanId}`)
}

watch(filtro, (value) => {
	router.replace({ query: { ...route.query, q: value || undefined, owner_type: undefined, owner_id: undefined } })
})

onMounted(async () => {
	const ownerType = String(route.query.owner_type || route.query.ownerType || '').trim().toUpperCase()
	const ownerId = Number(onlyDigits(route.query.owner_id || route.query.ownerId || ''))

	if (ownerType === 'CLIENTE' && ownerId > 0) {
		router.replace(`/arquivos/importacao/${ownerId}`)
		return
	}

	await carregarClientes()
})
</script>

<style scoped>
.arquivos-list {
	min-height: 100%;
	background: var(--ds-color-surface);
	font-family: 'Segoe UI Variable Text', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.arquivos-list :deep(.ds-shell-card) {
	border: 0;
	border-radius: 0;
	box-shadow: none;
	background: transparent;
	backdrop-filter: none;
}

.arquivos-list :deep(.ds-header-block) {
	padding-top: 1.25rem;
	padding-bottom: 1rem;
	padding-left: 1rem;
	padding-right: 1rem;
}

@media (min-width: 768px) {
	.arquivos-list :deep(.ds-header-block) {
		padding-top: 1.6rem;
		padding-bottom: 1.15rem;
		padding-left: 1.5rem;
		padding-right: 1.5rem;
	}
}

@media (min-width: 1024px) {
	.arquivos-list :deep(.ds-header-block) {
		padding-top: 1.85rem;
		padding-bottom: 1.25rem;
		padding-left: 2rem;
		padding-right: 2rem;
	}
}

.arquivos-list :deep(.ds-header-title) {
	font-size: clamp(1.35rem, 1.08rem + 0.45vw, 1.8rem);
	font-weight: 620;
	letter-spacing: -0.03em;
}

.arquivos-list :deep(.ds-header-subtitle) {
	max-width: 40rem;
	color: var(--ds-color-text-faint);
	font-size: 0.84rem;
	font-weight: 430;
}

.arquivos-list :deep(.ds-header-icon) {
	width: 2.35rem;
	height: 2.35rem;
	border-radius: 999px;
	border-color: rgba(214, 224, 234, 0.7);
	background: transparent;
	color: var(--ds-color-primary);
	font-size: 0.92rem;
	box-shadow: none;
}

.dark .arquivos-list :deep(.ds-header-icon) {
	border-color: rgba(51, 71, 102, 0.72);
	background: transparent;
}

.arquivos-list__actions {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 0.85rem;
	width: 100%;
	flex-wrap: wrap;
}

.arquivos-list__search {
	width: 100%;
	order: 1;
}

.arquivos-list :deep(.ds-search-shell) {
	position: relative;
}

.arquivos-list :deep(.ds-search-input) {
	height: 2.7rem;
	border-top: 0;
	border-left: 0;
	border-right: 0;
	border-bottom-width: 1px;
	border-radius: 0;
	border-color: rgba(214, 224, 234, 0.92);
	background: transparent;
	box-shadow: none;
	padding-left: 1.9rem;
	padding-right: 0.25rem;
	font-size: 0.88rem;
	color: var(--ds-color-text);
	position: relative;
	z-index: 1;
}

.dark .arquivos-list :deep(.ds-search-input) {
	border-color: rgba(51, 71, 102, 0.84);
	background: transparent;
}

.arquivos-list :deep(.ds-search-input::placeholder) {
	color: var(--ds-color-text-faint);
	font-size: 0.84rem;
	font-weight: 400;
}

.arquivos-list :deep(.ds-search-input:hover) {
	border-color: rgba(188, 203, 221, 0.96);
}

.arquivos-list :deep(.ds-search-input:focus) {
	border-color: rgba(44, 111, 163, 0.28);
	box-shadow: none;
}

.arquivos-list :deep(.ds-search-icon) {
	position: absolute;
	top: 50%;
	left: 0.35rem;
	transform: translateY(-50%);
	z-index: 2;
	color: var(--ds-color-primary);
	opacity: 1;
	pointer-events: none;
}

.arquivos-list :deep(.ds-search-shell:focus-within .ds-search-icon) {
	color: var(--ds-color-primary);
}

.arquivos-list__refresh {
	min-height: 2.55rem;
	padding-inline: 1rem;
	border-radius: 0.9rem;
	box-shadow: none;
	filter: none;
	display: inline-flex;
	align-items: center;
	gap: 0.45rem;
}

@media (min-width: 640px) {
	.arquivos-list__search {
		width: 21rem;
		order: 0;
	}
}

.arquivos-list__content {
	width: min(100%, 1460px);
	margin-inline: auto;
	padding: 0.35rem 0.75rem 1.75rem;
}

.arquivos-list :deep(.ds-table__element) {
	table-layout: fixed;
	min-width: 1080px;
}

.arquivos-list :deep(.ds-table-head-row) {
	background: transparent;
	border-bottom-color: rgba(214, 224, 234, 0.55);
}

.arquivos-list :deep(.ds-table__head-cell) {
	padding-top: 0.72rem;
	padding-bottom: 0.55rem;
	color: var(--ds-color-text-faint);
	font-size: 11px;
	font-weight: 600;
	letter-spacing: 0.05em;
	text-transform: none;
	white-space: normal;
}

.arquivos-list :deep(.ds-table__cell) {
	padding-top: 0.78rem;
	padding-bottom: 0.78rem;
	border-bottom: 1px solid rgba(214, 224, 234, 0.42);
}

.arquivos-list :deep(.ds-table__head-cell),
.arquivos-list :deep(.ds-table__cell) {
	padding-left: 0.85rem;
	padding-right: 0.85rem;
}

.arquivos-list :deep(.ds-table__head-cell:last-child),
.arquivos-list :deep(.ds-table__cell:last-child) {
	padding-right: 0.75rem;
}

.arquivos-list :deep(.ds-table__scroll) {
	overflow-x: auto;
}

.arquivos-list :deep(.ds-table__row:hover) {
	background: rgba(255, 255, 255, 0.38);
}

.dark .arquivos-list :deep(.ds-table__row:hover) {
	background: rgba(18, 30, 49, 0.32);
}

.arquivos-list :deep(.ds-table__row:hover td:first-child) {
	box-shadow: inset 2px 0 0 0 rgba(188, 203, 221, 0.9);
}

.arquivos-list__identity {
	display: flex;
	align-items: center;
	gap: 0.65rem;
	min-width: 0;
}

.arquivos-list__initials {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 2.25rem;
	height: 2.25rem;
	border-radius: 0.75rem;
	border: 1px solid rgba(214, 224, 234, 0.78);
	background: rgba(245, 248, 251, 0.9);
	color: var(--ds-color-text-faint);
	font-size: 0.64rem;
	font-weight: 600;
	letter-spacing: 0.06em;
	flex-shrink: 0;
}

.dark .arquivos-list__initials {
	background: rgba(18, 30, 49, 0.62);
	border-color: rgba(51, 71, 102, 0.76);
}

.arquivos-list__identity-copy,
.arquivos-list__stack {
	display: flex;
	flex-direction: column;
	min-width: 0;
}

.arquivos-list__primary {
	color: var(--ds-color-text);
	font-size: 0.94rem;
	font-weight: 540;
	line-height: 1.4;
	letter-spacing: -0.01em;
	word-break: break-word;
	overflow: hidden;
	text-overflow: ellipsis;
}

.arquivos-list__secondary {
	color: var(--ds-color-text-faint);
	font-size: 0.74rem;
	font-weight: 430;
	line-height: 1.45;
	overflow: hidden;
	text-overflow: ellipsis;
}

.arquivos-list__secondary-detail {
	margin-left: 0.5rem;
}

.arquivos-list__open-action {
	padding-inline: 0.65rem;
}

.arquivos-list__actions-cell {
	width: 100%;
	justify-content: flex-end;
	gap: 0;
}

@media (max-width: 1280px) {
	.arquivos-list__content {
		width: 100%;
		padding-inline: 1rem;
	}

	.arquivos-list :deep(.ds-table__element) {
		min-width: 980px;
	}
}

@media (max-width: 1100px) {
	.arquivos-list :deep(.ds-table__head-cell),
	.arquivos-list :deep(.ds-table__cell) {
		padding-left: 0.72rem;
		padding-right: 0.72rem;
	}

	.arquivos-list :deep(.ds-table__head-cell) {
		font-size: 10px;
	}

	.arquivos-list :deep(.ds-table__element) {
		min-width: 860px;
	}
}

@media (max-width: 768px) {
	.arquivos-list__content {
		padding-inline: 0.75rem;
		padding-bottom: 1.25rem;
	}

	.arquivos-list :deep(.ds-table__element) {
		min-width: 740px;
	}

	.arquivos-list :deep(.ds-table__head-cell),
	.arquivos-list :deep(.ds-table__cell) {
		padding-left: 0.65rem;
		padding-right: 0.65rem;
	}

	.arquivos-list__identity {
		gap: 0.55rem;
	}

	.arquivos-list__initials {
		width: 2rem;
		height: 2rem;
	}
}

@media (max-width: 560px) {
	.arquivos-list__content {
		padding-inline: 0.5rem;
	}

	.arquivos-list :deep(.ds-table__element) {
		min-width: 680px;
	}

	.arquivos-list__refresh {
		width: 100%;
		justify-content: center;
	}
}
</style>
