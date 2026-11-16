export const NO_DEATHS_MESSAGE = 'Ninguém foi assassinado nesta noite'

/**
 * Deriva o resultado da noite a partir da sessão da partida.
 * @param {{ nightResult?: { eliminatedParticipantIds?: string[] } | null }} session
 * @param {Record<string, string>} [participantNames]
 * @returns {{ eliminatedNames: string[], hasDeaths: boolean, message: string }}
 */
export function getDawnResult(session, participantNames = {}) {
  const eliminatedIds = session?.nightResult?.eliminatedParticipantIds ?? []
  const eliminatedNames = eliminatedIds.map(
    (participantId) => participantNames[participantId] ?? participantId,
  )
  const hasDeaths = eliminatedNames.length > 0

  return {
    eliminatedNames,
    hasDeaths,
    message: hasDeaths
      ? `Participantes assassinados: ${eliminatedNames.join(', ')}`
      : NO_DEATHS_MESSAGE,
  }
}

export default getDawnResult
