import { getAliveParticipants } from '@/entities/match'

/**
 * Opções de votação: apenas participantes vivos.
 * @param {unknown} session
 * @param {Record<string, string>} [participantNames]
 * @returns {Array<{ value: string, label: string }>}
 */
export function getVotingOptions(session, participantNames = {}) {
  return getAliveParticipants(session).map((participant) => ({
    value: participant.id,
    label: participantNames[participant.participantId] ?? participant.participantId,
  }))
}

export default getVotingOptions
