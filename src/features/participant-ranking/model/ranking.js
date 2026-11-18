import { MatchStatus } from '@/entities/match'
import { PlayerStatus } from '@/entities/match-participant'

const NAME_COLLATOR = new Intl.Collator('pt-BR', { sensitivity: 'base' })

/**
 * Ranqueia todos os participantes cadastrados pela quantidade de sobrevivências
 * em partidas finalizadas. Empates são ordenados alfabeticamente pelo nome.
 * @param {Array<{ id: string, name: string }> | null | undefined} participants
 * @param {Array<object> | null | undefined} matches
 * @returns {Array<{ participantId: string, name: string, survivalCount: number }>}
 */
export function rankParticipants(participants, matches) {
  const participantList = Array.isArray(participants) ? participants : []
  const matchList = Array.isArray(matches) ? matches : []
  const survivalCounts = new Map(
    participantList.map((participant) => [participant.id, 0]),
  )

  for (const match of matchList) {
    if (match?.status !== MatchStatus.FINISHED) {
      continue
    }

    const matchParticipants = Array.isArray(match.participants)
      ? match.participants
      : []

    for (const matchParticipant of matchParticipants) {
      if (matchParticipant?.status !== PlayerStatus.ALIVE) {
        continue
      }

      if (survivalCounts.has(matchParticipant.participantId)) {
        survivalCounts.set(
          matchParticipant.participantId,
          survivalCounts.get(matchParticipant.participantId) + 1,
        )
      }
    }
  }

  return participantList
    .map((participant) => ({
      participantId: participant.id,
      name: participant.name,
      survivalCount: survivalCounts.get(participant.id) ?? 0,
    }))
    .sort(
      (left, right) =>
        right.survivalCount - left.survivalCount ||
        NAME_COLLATOR.compare(left.name, right.name),
    )
}

export default rankParticipants
