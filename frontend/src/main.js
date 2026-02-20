import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import storage from '@/utils/storage'
import { notify } from '@/services/notify'

// ✅ Ao reabrir o app (após fechar): logout + limpar abas → tela de login e página inicial sem abas
const SESSION_KEY = 'acasa:session'
const TAB_STORAGE_KEY = 'acasa:tabs:v1'
if (!sessionStorage.getItem(SESSION_KEY)) {
  storage.removeToken()
  storage.removeUser()
  storage.removeRefreshToken()
  try {
    localStorage.removeItem(TAB_STORAGE_KEY)
  } catch (_) {}
  sessionStorage.setItem(SESSION_KEY, '1')
}

// Estilos
import '@/assets/CSS/tailwind.css'
import 'primeicons/primeicons.css'
import '@/assets/hide-password-eye.css'

// ✅ DevTools auto (Tauri)
import { autoOpenDevtools } from './devtools-auto'

// UI Components
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import CustomCheckbox from '@/components/ui/CustomCheckbox.vue'
import FormActions from '@/components/ui/FormActions.vue'
import Input from '@/components/ui/Input.vue'
import MetricCard from '@/components/ui/MetricCard.vue'
import NavMenu from '@/components/ui/NavMenu.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import Table from '@/components/ui/Table.vue'
import TableActions from '@/components/ui/TableActions.vue'
import ToastContainer from '@/components/ui/ToastContainer.vue'
import CardSection from '@/components/ui/CardSection.vue'
import TablePagination from '@/components/ui/TablePagination.vue'

// Modals
import QuickCreateProduto from '@/components/modals/QuickCreateProduto.vue'
import ArquivosModal from '@/components/modals/ArquivosModal.vue'
import FinanceiroModal from '@/components/modals/FinanceiroModal.vue'
import AgendamentosModal from '@/components/modals/AgendamentosModal.vue'

// Common
import Loading from '@/components/common/Loading.vue'
import ProcessoClienteFlow from '@/components/common/ProcessoClienteFlow.vue'
import Select from '@/components/common/Select.vue'

// Importação da Diretiva de Permissão
import { can } from '@/services/permissions'

const app = createApp(App)

// Mostra erro na UI: toast sempre (visível no Tauri); alert como fallback
function showErrorToUser(title, message) {
  const text = message ? `${title}: ${message}` : title
  console.error('[ACASA_ERROR]', text)
  notify.error(String(text).slice(0, 300))
  try { alert(text) } catch (_) {}
}

// ✅ GLOBAL ERROR HANDLER (Vue + Tauri: toast sempre; dialog no Tauri)
app.config.errorHandler = (err, instance, info) => {
  const msg = err?.message || String(err)
  showErrorToUser('Erro inesperado', `${msg} (${info || ''})`)
}

// ✅ Captura erros globais e promessas rejeitadas
window.onerror = (message, source, lineno, colno) => {
  showErrorToUser('Erro JS', `${message} em ${source}:${lineno}:${colno}`)
}

window.addEventListener('unhandledrejection', (event) => {
  const reason = event?.reason?.message || event?.reason || 'Unknown'
  showErrorToUser('Operação falhou', String(reason))
})

// Registro Global - UI
app.component('Button', Button)
app.component('Card', Card)
app.component('ConfirmModal', ConfirmModal)
app.component('CustomCheckbox', CustomCheckbox)
app.component('FormActions', FormActions)
app.component('Input', Input)
app.component('MetricCard', MetricCard)
app.component('NavMenu', NavMenu)
app.component('PageHeader', PageHeader)
app.component('SearchInput', SearchInput)
app.component('StatusBadge', StatusBadge)
app.component('Table', Table)
app.component('TableActions', TableActions)
app.component('ToastContainer', ToastContainer)
app.component('CardSection', CardSection)
app.component('TablePagination', TablePagination)

// Common
app.component('Loading', Loading)
app.component('ProcessoClienteFlow', ProcessoClienteFlow)
app.component('Select', Select)

// Modals
app.component('QuickCreateProduto', QuickCreateProduto)
app.component('ArquivosModal', ArquivosModal)
app.component('FinanceiroModal', FinanceiroModal)
app.component('AgendamentosModal', AgendamentosModal)

// Diretiva v-can
app.directive('can', {
  beforeMount(el, binding) {
    const allowed = can(binding.value)
    el.__vCanDisplay = el.style.display
    if (!allowed) el.style.display = 'none'
  },
  updated(el, binding) {
    const allowed = can(binding.value)
    const original = el.__vCanDisplay ?? ''
    el.style.display = allowed ? original : 'none'
  },
  unmounted(el) {
    delete el.__vCanDisplay
  }
})

app.use(router)

// ✅ evita hard reload em logout por erro 401
window.addEventListener('acasa-auth-logout', () => {
  if (router.currentRoute.value?.path !== '/login') {
    router.push('/login')
  }
})

// ✅ chama aqui (antes do mount)
autoOpenDevtools()

// ✅ Android: ao abrir o app, verifica se há nova versão no subdomínio e avisa
import { checkAndroidUpdate } from '@/utils/check-android-update'
router.isReady().then(() => {
  setTimeout(() => checkAndroidUpdate(), 2000)
})

const maybeRunUpdater = async () => {
  // Só roda quando estiver dentro do Tauri (desktop).
  if (!window.__TAURI__ && !window.__TAURI_INTERNALS__) return

  try {
    const currentVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '?'
    notify.info('Tauri: verificando atualização...')

    const { check } = await import('@tauri-apps/plugin-updater')
    const update = await check()

    if (update?.available) {
      notify.info(`Tauri: atualização ${update.version} encontrada. Baixando...`)
      await update.downloadAndInstall()
      notify.success('Tauri: atualização instalada. Reiniciando o app...')
      window.location.reload()
    } else {
      notify.info('Tauri: nenhuma atualização disponível.')
    }
  } catch (err) {
    console.error('[ACASA_UPDATER]', err)
    const msg = err?.message || String(err)
    notify.error(`Tauri updater erro: ${msg}`)
  }
}

// Desktop (Tauri): checa atualização automaticamente ao iniciar o app.
maybeRunUpdater()

const setAppTitleWithVersion = async () => {
  const baseTitle = 'A Casa Marcenaria'

  // Web fallback: mantém título base.
  if (!window.__TAURI__ && !window.__TAURI_INTERNALS__) {
    document.title = baseTitle
    return
  }

  try {
    const [{ getCurrentWindow }] = await Promise.all([
      import('@tauri-apps/api/window')
    ])
    document.title = baseTitle
    await getCurrentWindow().setTitle(baseTitle)
  } catch (err) {
    console.error('[ACASA_TITLE_VERSION]', err)
    document.title = baseTitle
  }
}

setAppTitleWithVersion()

app.mount('#app')
