/**
 * Converte um valor de data em string ISO 8601 UTC.
 * @param {Date | string | number} [value]
 * @returns {string}
 */
export function nowIso(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) {
    throw new TypeError('Invalid date value.')
  }

  return date.toISOString()
}

/**
 * Formata uma data em pt-BR no formato curto.
 * @param {Date | string | number} value
 * @param {Intl.DateTimeFormatOptions} [options]
 * @returns {string}
 */
export function formatDatePtBr(value, options = {}) {
  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    ...options,
  }).format(date)
}

/**
 * Formata data e hora em pt-BR.
 * @param {Date | string | number} value
 * @param {Intl.DateTimeFormatOptions} [options]
 * @returns {string}
 */
export function formatDateTimePtBr(value, options = {}) {
  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    ...options,
  }).format(date)
}
