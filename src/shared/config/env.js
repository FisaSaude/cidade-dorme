const apiBaseUrl = import.meta.env?.VITE_API_BASE_URL ?? '/api'

/**
 * Configuração de ambiente exposta à aplicação.
 * `VITE_API_BASE_URL` permite sobrescrever o proxy padrão `/api`.
 */
export const env = Object.freeze({
  apiBaseUrl: apiBaseUrl || '/api',
})

export default env
