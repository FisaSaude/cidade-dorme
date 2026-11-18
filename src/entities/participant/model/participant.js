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
 * Normaliza `deletedAt`: ausente ou nulo vira `null`; string ISO é preservada.
 * @param {unknown} deletedAt
 * @returns {string | null}
 */
export function normalizeParticipantDeletedAt(deletedAt) {
  if (deletedAt === undefined || deletedAt === null) {
    return null
  }

  if (typeof deletedAt !== 'string' || !deletedAt.trim()) {
    throw new TypeError('Participant deletedAt must be an ISO string or null.')
  }

  return deletedAt
}

/**
 * Indica se o participante pertence ao cadastro ativo.
 * @param {{ deletedAt?: string | null } | null | undefined} participant
 * @returns {boolean}
 */
export function isParticipantActive(participant) {
  return normalizeParticipantDeletedAt(participant?.deletedAt) === null
}

/**
 * Arquiva o participante preservando id e o último nome.
 * @param {{ id: string, name: string, deletedAt?: string | null }} participant
 * @param {string} deletedAt
 * @returns {{ id: string, name: string, deletedAt: string }}
 */
export function archiveParticipant(participant, deletedAt) {
  if (typeof deletedAt !== 'string' || !deletedAt.trim()) {
    throw new TypeError('An ISO date is required to archive a participant.')
  }

  return {
    ...participant,
    id: participant.id,
    name: participant.name,
    deletedAt,
  }
}

/**
 * Verifica se o nome já existe entre os ativos, ignorando
 * maiúsculas/minúsculas e o próprio id.
 * @param {Array<{ id: string, name: string, deletedAt?: string | null }>} [participants]
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
      isParticipantActive(participant) &&
      participant.id !== excludeId &&
      foldParticipantName(participant.name) === candidate,
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
 * @param {{ id?: string, name?: string, deletedAt?: string | null }} [input]
 * @returns {{ id: string, name: string, deletedAt: string | null }}
 */
export function createParticipant({ id, name, deletedAt = null } = {}) {
  if (typeof id !== 'string' || !id.trim()) {
    throw new TypeError('Participant id is required.')
  }

  const normalized = normalizeParticipantName(name)

  if (!normalized) {
    throw new GameRuleError('PARTICIPANT_NAME_REQUIRED')
  }

  return {
    id,
    name: normalized,
    deletedAt: normalizeParticipantDeletedAt(deletedAt),
  }
}

/**
 * Renomeia um participante preservando todos os demais campos, inclusive o id.
 * @param {{ id: string, name: string, deletedAt?: string | null }} participant
 * @param {unknown} name
 * @returns {{ id: string, name: string, deletedAt: string | null }}
 */
export function renameParticipant(participant, name) {
  const normalized = normalizeParticipantName(name)

  if (!normalized) {
    throw new GameRuleError('PARTICIPANT_NAME_REQUIRED')
  }

  return {
    ...participant,
    name: normalized,
    deletedAt: normalizeParticipantDeletedAt(participant.deletedAt),
  }
}
