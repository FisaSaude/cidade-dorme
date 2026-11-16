import { httpClient } from '@/shared/api/httpClient'
import { ApiError } from '@/shared/lib/errors'
import { createId } from '@/shared/lib/id'
import { createParticipant, validateParticipantName } from '../model/participant'

/**
 * @param {unknown} value
 * @returns {{ id: string, name: string }}
 */
function assertParticipant(value) {
  const isObject = value !== null && typeof value === 'object'
  const hasValidId =
    isObject && typeof value.id === 'string' && value.id.trim().length > 0
  const hasValidName = isObject && typeof value.name === 'string'

  if (!hasValidId || !hasValidName) {
    throw new ApiError('A resposta do servidor é inválida.')
  }

  return { id: value.id, name: value.name }
}

/**
 * Repositório de participantes sobre o cliente HTTP injetável.
 * @param {{ client?: { get: Function, post: Function, patch: Function }, idFactory?: () => string }} [options]
 */
export function createParticipantRepository(options = {}) {
  const client = options.client ?? httpClient
  const idFactory = options.idFactory ?? createId

  async function list() {
    const data = await client.get('/participants')

    if (!Array.isArray(data)) {
      throw new ApiError('A resposta do servidor é inválida.')
    }

    return data.map(assertParticipant)
  }

  /**
   * @param {{ name: string }} input
   */
  async function create({ name } = {}) {
    const participant = createParticipant({ id: idFactory(), name })
    const created = await client.post('/participants', participant)
    return assertParticipant(created)
  }

  /**
   * @param {string} id
   * @param {{ name: string }} input
   */
  async function update(id, { name } = {}) {
    if (typeof id !== 'string' || !id.trim()) {
      throw new TypeError('Participant id is required.')
    }

    const normalizedName = validateParticipantName(name)
    let updated

    try {
      updated = await client.patch(`/participants/${id}`, {
        name: normalizedName,
      })
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        throw new ApiError('Participante não encontrado', 404, error)
      }

      throw error
    }

    return assertParticipant(updated)
  }

  return { list, create, update }
}

export const participantRepository = createParticipantRepository()

export default participantRepository
