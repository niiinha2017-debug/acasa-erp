import { reactive } from 'vue'

export const confirmState = reactive({
  isOpen: false,
  title: '',
  message: '',
  resolve: null,
})

function closeWith(result) {
  const resolver = confirmState.resolve

  // fecha e limpa antes de resolver (evita reentrância)
  confirmState.isOpen = false
  confirmState.resolve = null

  // só resolve se for function
  if (typeof resolver === 'function') {
    resolver(result)
  }
}

export const confirm = {
  show(title, message) {
    // se já tinha um confirm aberto, cancela o anterior
    if (confirmState.isOpen) {
      closeWith(false)
    }

    confirmState.title = title ?? ''
    confirmState.message = message ?? ''
    confirmState.isOpen = true

    return new Promise((resolve) => {
      confirmState.resolve = resolve
    })
  },

  cancel() {
    closeWith(false)
  },

  confirm() {
    closeWith(true)
  },
}
