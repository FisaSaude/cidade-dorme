import { httpClient } from '@/shared/api/httpClient'
import { ApiError } from '@/shared/lib/errors'
import { MatchStatus } from '../model/matchStatus'

const INVALID_RESPONSE_MESSAGE = 'A resposta do servidor é inválida.'
const FINISHED_MATCHES_PATH =
  '/matches?status=FINISHED&_sort=endedAt&_order=desc'

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

/**
 * @param {unknown} value
 * @returns {{ id: string, participantId: string, role: string, status: string, eliminatedAt: object | null }}
 */
function assertMatchParticipant(value) {
  const isObject = value !== null && typeof value === 'object'
  const participant = /** @type {Record<string, unknown>} */ (value)

  if (
    !isObject ||
    !isNonEmptyString(participant.id) ||
    !isNonEmptyString(participant.participantId) ||
    !isNonEmptyString(participant.role) ||
    !isNonEmptyString(participant.status)
  ) {
    throw new ApiError(INVALID_RESPONSE_MESSAGE)
  }

  return {
    id: /** @type {string} */ (participant.id),
    participantId: /** @type {string} */ (participant.participantId),
    role: /** @type {string} */ (participant.role),
    status: /** @type {string} */ (participant.status),
    eliminatedAt:
      participant.eliminatedAt === undefined ? null : participant.eliminatedAt,
  }
}

/**
 * Valida e normaliza um documento de partida recebido da API.
 * @param {unknown} value
 */
function assertMatchDocument(value) {
  const isObject = value !== null && typeof value === 'object'
  const match = /** @type {Record<string, unknown>} */ (value)

  if (
    !isObject ||
    !isNonEmptyString(match.id) ||
    !isNonEmptyString(match.status) ||
    !isNonEmptyString(match.startedAt) ||
    !Number.isInteger(match.turnCount) ||
    !Array.isArray(match.participants)
  ) {
    throw new ApiError(INVALID_RESPONSE_MESSAGE)
  }

  return {
    id: /** @type {string} */ (match.id),
    status: /** @type {string} */ (match.status),
    closureReason: match.closureReason ?? null,
    winner: match.winner ?? null,
    startedAt: /** @type {string} */ (match.startedAt),
    endedAt: match.endedAt ?? null,
    turnCount: /** @type {number} */ (match.turnCount),
    participants: match.participants.map(assertMatchParticipant),
  }
}

/**
 * Prepara o documento final para o PUT idempotente.
 * @param {unknown} value
 */
function assertFinishedMatchInput(value) {
  const isObject = value !== null && typeof value === 'object'
  const match = /** @type {Record<string, unknown>} */ (value)

  if (!isObject || !isNonEmptyString(match.id)) {
    throw new TypeError('Match id is required to persist a finished match.')
  }

  if (match.status !== MatchStatus.FINISHED) {
    throw new TypeError('Only finished matches can be persisted.')
  }

  return assertMatchDocument(match)
}

/**
 * Repositório de partidas sobre o cliente HTTP injetável.
 * @param {{ client?: { get: Function, put: Function } }} [options]
 */
export function createMatchRepository(options = {}) {
  const client = options.client ?? httpClient

  async function listFinished() {
    const data = await client.get(FINISHED_MATCHES_PATH)

    if (!Array.isArray(data)) {
      throw new ApiError(INVALID_RESPONSE_MESSAGE)
    }

    return data.map(assertMatchDocument)
  }

  /**
   * @param {string} id
   */
  async function getById(id) {
    if (!isNonEmptyString(id)) {
      throw new TypeError('Match id is required.')
    }

    const data = await client.get(`/matches/${id}`)
    return assertMatchDocument(data)
  }

  /**
   * @param {object} match
   */
  async function saveFinishedMatch(match) {
    const document = assertFinishedMatchInput(match)
    const saved = await client.put(`/matches/${document.id}`, document)
    return assertMatchDocument(saved)
  }

  return { listFinished, getById, saveFinishedMatch }
}

export const matchRepository = createMatchRepository()

export default matchRepository
