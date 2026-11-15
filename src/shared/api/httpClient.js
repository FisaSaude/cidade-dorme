import { env } from '@/shared/config/env'
import { ApiError } from '@/shared/lib/errors'

const JSON_HEADERS = Object.freeze({
  Accept: 'application/json',
  'Content-Type': 'application/json',
})

/**
 * @param {number} status
 * @returns {string}
 */
function safeStatusMessage(status) {
  if (status === 400) {
    return 'A requisição não pôde ser processada.'
  }

  if (status === 404) {
    return 'O recurso solicitado não foi encontrado.'
  }

  if (status >= 500) {
    return 'O servidor apresentou um erro. Tente novamente.'
  }

  return 'Não foi possível concluir a operação.'
}

/**
 * @param {string} baseUrl
 * @param {string} path
 * @returns {string}
 */
function resolveUrl(baseUrl, path) {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${normalizedBase}${normalizedPath}`
}

/**
 * Cria um cliente HTTP com `fetch` injetável.
 * @param {{ fetchImpl?: typeof fetch, baseUrl?: string }} [options]
 */
export function createHttpClient(options = {}) {
  const fetchImpl = options.fetchImpl ?? ((...args) => fetch(...args))
  const baseUrl = options.baseUrl ?? env.apiBaseUrl

  /**
   * @param {string} path
   * @param {{ method?: string, body?: unknown, headers?: Record<string, string>, signal?: AbortSignal }} [requestOptions]
   * @returns {Promise<any>}
   */
  async function request(path, requestOptions = {}) {
    const { method = 'GET', body, headers = {}, signal } = requestOptions
    const url = resolveUrl(baseUrl, path)

    let response

    try {
      response = await fetchImpl(url, {
        method,
        headers: { ...JSON_HEADERS, ...headers },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal,
      })
    } catch (cause) {
      throw new ApiError(
        'Não foi possível conectar ao servidor. Verifique se o JSON Server está em execução.',
        null,
        cause,
      )
    }

    if (!response.ok) {
      throw new ApiError(safeStatusMessage(response.status), response.status)
    }

    if (response.status === 204) {
      return null
    }

    try {
      return await response.json()
    } catch (cause) {
      throw new ApiError('A resposta do servidor é inválida.', response.status, cause)
    }
  }

  return {
    request,
    get: (path, requestOptions) => request(path, { ...requestOptions, method: 'GET' }),
    post: (path, body, requestOptions) =>
      request(path, { ...requestOptions, method: 'POST', body }),
    patch: (path, body, requestOptions) =>
      request(path, { ...requestOptions, method: 'PATCH', body }),
    put: (path, body, requestOptions) =>
      request(path, { ...requestOptions, method: 'PUT', body }),
    delete: (path, requestOptions) =>
      request(path, { ...requestOptions, method: 'DELETE' }),
  }
}

export const httpClient = createHttpClient()

export default httpClient
