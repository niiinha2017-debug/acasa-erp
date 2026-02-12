import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Estilos
import '@/assets/CSS/tailwind.css'
import 'primeicons/primeicons.css'
import '@/assets/hide-password-eye.css'

// âœ… DevTools auto (Tauri)
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

// Common
import Loading from '@/components/common/Loading.vue'
import ProcessoClienteFlow from '@/components/common/ProcessoClienteFlow.vue'
import Select from '@/components/common/Select.vue'

// ImportaÃ§Ã£o da Diretiva de PermissÃ£o
import { can } from '@/services/permissions'
import { getPageTitleForTarget, openRouteInNewContext, shouldOpenInNewWindow } from '@/utils/open-route'
import storage from '@/utils/storage'

const app = createApp(App)

// âœ… GLOBAL ERROR HANDLER (DEBUG MOBILE)
app.config.errorHandler = (err, instance, info) => {
  console.error('[ACASA_VUE_ERROR]', err)
  // Mostra erro na tela para o usuÃ¡rio ver no celular
  alert(`Erro Inesperado: ${err.message}\nInfo: ${info}`)
}

// âœ… Captura erros globais e promessas rejeitadas
window.onerror = (message, source, lineno, colno) => {
  console.error('[ACASA_WINDOW_ERROR]', message, source, lineno, colno)
  alert(`Erro JS: ${message}\n${source}:${lineno}:${colno}`)
}

window.addEventListener('unhandledrejection', (event) => {
  const reason = event?.reason?.message || event?.reason || 'Unknown'
  console.error('[ACASA_UNHANDLED_REJECTION]', event?.reason)
  alert(`Promise rejeitada: ${reason}`)
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

const clearLocalSession = () => {
  storage.removeToken()
  storage.removeUser()
  storage.removeRefreshToken()
  sessionStorage.removeItem('ACASA_FORCE_PENDING')
}

const getInitialWindowParams = () => {
  try {
    const url = new URL(window.location.href)
    return {
      openRoute: url.searchParams.get('openRoute'),
      openTitle: url.searchParams.get('openTitle'),
      url,
    }
  } catch {
    return { openRoute: null, openTitle: null, url: null }
  }
}

// âœ… evita hard reload em logout por erro 401
window.addEventListener('acasa-auth-logout', () => {
  if (router.currentRoute.value?.path !== '/login') {
    router.push('/login')
  }
})

// âœ… chama aqui (antes do mount)
autoOpenDevtools()

const setNativeWindowTitleWithVersion = async () => {
  try {
    const { openTitle } = getInitialWindowParams()
    const [{ getCurrentWindow }, { getVersion }] = await Promise.all([
      import('@tauri-apps/api/window'),
      import('@tauri-apps/api/app'),
    ])
    const version = await getVersion()
    const pageTitle = openTitle || getPageTitleForTarget(router, router.currentRoute.value)
    await getCurrentWindow().setTitle(`${pageTitle} | ERP v${version}`)
  } catch (err) {
    // Sem contexto Tauri (web/mobile) ou sem permissao de janela: ignora.
    const msg = String(err?.message || err || '')
    const lower = msg.toLowerCase()
    if (
      msg.includes('allow-set-title') ||
      msg.includes('not allowed') ||
      lower.includes('tauri') ||
      lower.includes('window') ||
      lower.includes('context')
    ) return
    console.warn('[ACASA_TITLEBAR]', err)
  }
}

const installDynamicWindowTitleSync = async () => {
  if (!window.__TAURI__ && !window.__TAURI_INTERNALS__) return
  try {
    const [{ getCurrentWindow }, { getVersion }] = await Promise.all([
      import('@tauri-apps/api/window'),
      import('@tauri-apps/api/app'),
    ])
    const [win, version] = await Promise.all([getCurrentWindow(), getVersion()])

    router.afterEach((to) => {
      const pageTitle = getPageTitleForTarget(router, to)
      win.setTitle(`${pageTitle} | ERP v${version}`).catch(() => {})
    })
  } catch (err) {
    console.warn('[ACASA_TITLE_SYNC]', err)
  }
}

const installTauriPushAsNewWindow = () => {
  if (!window.__TAURI__ && !window.__TAURI_INTERNALS__) return
  if (router.__acasaOriginalPush) return

  const { openRoute } = getInitialWindowParams()
  const isChildWindow = Boolean(openRoute)
  if (isChildWindow) return

  const originalPush = router.push.bind(router)
  router.__acasaOriginalPush = originalPush

  router.push = async (to) => {
    const resolved = router.resolve(to)
    const authLikeRoute = resolved.path === '/login' || resolved.path === '/pendente'
    if (authLikeRoute) return originalPush(to)
    if (!shouldOpenInNewWindow(resolved)) return originalPush(to)

    await openRouteInNewContext(router, to)
    return undefined
  }
}

const enforceFreshLoginOnMainWindow = async () => {
  if (!window.__TAURI__ && !window.__TAURI_INTERNALS__) return

  const { openRoute } = getInitialWindowParams()
  if (openRoute) return

  clearLocalSession()

  if (router.currentRoute.value?.path !== '/login') {
    await router.replace('/login')
  }
}

const installAutoLogoutOnMainClose = async () => {
  if (!window.__TAURI__ && !window.__TAURI_INTERNALS__) return

  const { openRoute } = getInitialWindowParams()
  if (openRoute) return

  try {
    const { getCurrentWindow } = await import('@tauri-apps/api/window')
    const win = getCurrentWindow()
    await win.onCloseRequested(() => {
      clearLocalSession()
    })
  } catch (err) {
    console.warn('[ACASA_CLOSE_LOGOUT]', err)
  }

  window.addEventListener('beforeunload', () => {
    clearLocalSession()
  })
}

const maybeRunUpdater = async () => {
  if (!window.__TAURI__ && !window.__TAURI_INTERNALS__) return
  if (import.meta.env?.DEV) return
  if (import.meta.env?.VITE_TAURI_UPDATER === 'false') return

  try {
    const { check } = await import('@tauri-apps/plugin-updater')
    const update = await check()

    if (update?.available) {
      await update.downloadAndInstall()
      window.location.reload()
    }
  } catch (err) {
    console.error('[ACASA_UPDATER]', err)
  }
}

setNativeWindowTitleWithVersion()
maybeRunUpdater()
installDynamicWindowTitleSync()
installAutoLogoutOnMainClose()

const applyInitialRouteFromQuery = async () => {
  try {
    const { openRoute, url } = getInitialWindowParams()
    if (!openRoute) return

    await router.replace(openRoute)
    if (!url) return
    url.searchParams.delete('openRoute')
    url.searchParams.delete('openTitle')
    window.history.replaceState(window.history.state, '', url.toString())
  } catch (err) {
    console.warn('[OPEN_ROUTE_INIT]', err)
  }
}

installTauriPushAsNewWindow()
enforceFreshLoginOnMainWindow()
  .then(() => applyInitialRouteFromQuery())
  .finally(() => {
    app.mount('#app')
  })

