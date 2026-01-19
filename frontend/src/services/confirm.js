import { reactive } from 'vue'

export const confirmState = reactive({
  isOpen: false,
  title: '',
  message: '',
  resolve: null
})

export const confirm = {
  show(title, message) {
    confirmState.title = title
    confirmState.message = message
    confirmState.isOpen = true
    
    // Cria uma promessa que será resolvida quando o usuário clicar nos botões
    return new Promise((resolve) => {
      confirmState.resolve = resolve
    })
  },
  
  cancel() {
    confirmState.isOpen = false
    confirmState.resolve(false)
  },
  
  confirm() {
    confirmState.isOpen = false
    confirmState.resolve(true)
  }
}