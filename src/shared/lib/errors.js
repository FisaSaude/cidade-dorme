/**
 * Erro de regra de negócio do domínio.
 * O código é estável, em inglês, e não deve ser trocado por textos de interface.
 */
export class GameRuleError extends Error {
  /**
   * @param {string} code
   * @param {string} [message]
   * @param {{ cause?: unknown }} [options]
   */
  constructor(code, message, options = {}) {
    const resolvedMessage = message ?? `Game rule violation: ${code}`
    super(resolvedMessage, options.cause ? { cause: options.cause } : undefined)
    this.name = 'GameRuleError'
    this.code = code
  }
}

/**
 * Erro de comunicação ou de formato da API.
 * A mensagem deve ser segura para exibição ao narrador.
 */
export class ApiError extends Error {
  /**
   * @param {string} message
   * @param {number | null} [status]
   * @param {unknown} [cause]
   */
  constructor(message, status = null, cause) {
    super(message, cause ? { cause } : undefined)
    this.name = 'ApiError'
    this.status = status
  }
}
