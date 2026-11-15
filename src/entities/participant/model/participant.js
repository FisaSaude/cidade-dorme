import { GameRuleError } from '@/shared/lib/errors'

/**
 * Normaliza o nome do participante removendo espaços nas extremidades.
 * @param {unknown} name
 * @returns {string}
 */
export function normalizeParticipantName(name) {
  if (typeof name !== 'string') {
    return ''
  }

  return name.trim()
}

/**
 * @param {unknown} name
 * @returns {string}
 */
function foldParticipantName(name) {
  return normalizeParticipantName(name).toLowerCase()
}

/**
 * Verifica se o nome já existe, ignorando maiúsculas/minúsculas e o próprio id.
 * @param {Array<{ id: string, name: string }>} [participants]
 * @param {unknown} name
 * @param {string | null} [excludeId]
 * @returns {boolean}
 */
export function isDuplicateParticipantName(participants, name, excludeId = null) {
  const candidate = foldParticipantName(name)

  if (!candidate) {
    return false
  }

  return (participants ?? []).some(
    (participant) =>
      participant.id !== excludeId && foldParticipantName(participant.name) === candidate,
  )
}

/**
 * Valida o nome obrigatório e único, retornando a grafia normalizada.
 * @param {unknown} name
 * @param {Array<{ id: string, name: string }>} [participants]
 * @param {string | null} [excludeId]
 * @returns {string}
 */
export function validateParticipantName(name, participants = [], excludeId = null) {
  const normalized = normalizeParticipantName(name)

  if (!normalized) {
    throw new GameRuleError('PARTICIPANT_NAME_REQUIRED')
  }

  if (isDuplicateParticipantName(participants, normalized, excludeId)) {
    throw new GameRuleError('PARTICIPANT_NAME_DUPLICATED')
  }

  return normalized
}

/**
 * Cria um participante preservando o id informado e a grafia normalizada do nome.
 * @param {{ id?: string, name?: string }} [input]
 * @returns {{ id: string, name: string }}
 */
export function createParticipant({ id, name } = {}) {
  if (typeof id !== 'string' || !id.trim()) {
    throw new TypeError('Participant id is required.')
  }

  const normalized = normalizeParticipantName(name)

  if (!normalized) {
    throw new GameRuleError('PARTICIPANT_NAME_REQUIRED')
  }

  return { id, name: normalized }
}

/**
 * Renomeia um participante preservando todos os demais campos, inclusive o id.
 * @param {{ id: string, name: string }} participant
 * @param {unknown} name
 * @returns {{ id: string, name: string }}
 */
export function renameParticipant(participant, name) {
  const normalized = normalizeParticipantName(name)

  if (!normalized) {
    throw new GameRuleError('PARTICIPANT_NAME_REQUIRED')
  }

  return { ...participant, name: normalized }
}
