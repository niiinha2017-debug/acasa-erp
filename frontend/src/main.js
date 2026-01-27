import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Estilos
import '@/assets/CSS/tailwind.css' 
import 'primeicons/primeicons.css' 

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
import ToastContainer from '@/components/ui/ToastContainer.vue' // Adicionado .vue
import CardSection from '@/components/ui/CardSection.vue'
import TablePagination from '@/components/ui/TablePagination.vue'


// Modals
import QuickCreateProduto from '@/components/modals/QuickCreateProduto.vue'
import FuncionarioArquivosModal from '@/components/modals/FuncionarioArquivosModal.vue'
import OrcamentoArquivosModal from '@/components/modals/OrcamentoArquivosModal.vue'
import VendaArquivosModal from '@/components/modals/VendaArquivosModal.vue'

// Common
import Loading from '@/components/common/Loading.vue' // Corrigido nome da variável e .vue
import ProcessoClienteFlow from '@/components/common/ProcessoClienteFlow.vue'
import Select from '@/components/common/Select.vue'

// Importação da Diretiva de Permissão
import { can } from '@/services/permissions'

const app = createApp(App)

// Registro Global - UI
app.component('Button', Button)
app.component('Card', Card)
app.component('ConfirmModal', ConfirmModal)
app.component('CustomCheckbox', CustomCheckbox)
app.component('FormActions', FormActions) // Corrigido de 'FormaActions'
app.component('Input', Input)
app.component ('MetricCard',MetricCard)
app.component('NavMenu', NavMenu)
app.component('PageHeader', PageHeader)
app.component('SearchInput', SearchInput)
app.component('StatusBadge', StatusBadge)
app.component('Table', Table)
app.component('TableActions', TableActions)
app.component('ToastContainer', ToastContainer)
app.component('CardSection',CardSection)
app.component('TablePagination', TablePagination)

// Common
app.component('Loading', Loading)
app.component('ProcessoClienteFlow', ProcessoClienteFlow)
app.component('Select', Select)

// Modals
app.component('QuickCreateProduto', QuickCreateProduto)
app.component('FuncionarioArquivosModal', FuncionarioArquivosModal)
app.component('OrcamentoArquivosModal', OrcamentoArquivosModal)
app.component('VendaArquivosModal', VendaArquivosModal)


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
app.mount('#app')