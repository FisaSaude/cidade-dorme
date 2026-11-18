import { MatchStatus } from '@/entities/match'
import { PlayerStatus } from '@/entities/match-participant'
import { isParticipantActive } from '@/entities/participant'

const NAME_COLLATOR = new Intl.Collator('pt-BR', { sensitivity: 'base' })

/**
 * @param {Array<object>} matchList
 * @returns {Set<string>}
 */
function collectReferencedParticipantIds(matchList) {
  const referenced = new Set()

  for (const match of matchList) {
    if (match?.status !== MatchStatus.FINISHED) {
      continue
    }

    const matchParticipants = Array.isArray(match.participants)
      ? match.participants
      : []

    for (const matchParticipant of matchParticipants) {
      if (matchParticipant?.participantId) {
        referenced.add(matchParticipant.participantId)
      }
    }
  }

  return referenced
}

/**
 * Ranqueia participantes ativos e arquivados que ainda aparecem em partidas
 * finalizadas pela quantidade de sobrevivências. Empates são ordenados
 * alfabeticamente pelo nome e, por fim, pelo identificador do participante.
 * @param {Array<{ id: string, name: string, deletedAt?: string | null }> | null | undefined} participants
 * @param {Array<object> | null | undefined} matches
 * @returns {Array<{ participantId: string, name: string, survivalCount: number }>}
 */
export function rankParticipants(participants, matches) {
  const participantList = Array.isArray(participants) ? participants : []
  const matchList = Array.isArray(matches) ? matches : []
  const referencedIds = collectReferencedParticipantIds(matchList)
  const candidates = participantList.filter(
    (participant) =>
      isParticipantActive(participant) || referencedIds.has(participant.id),
  )
  const survivalCounts = new Map(
    candidates.map((participant) => [participant.id, 0]),
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

  return candidates
    .map((participant) => ({
      participantId: participant.id,
      name: participant.name,
      survivalCount: survivalCounts.get(participant.id) ?? 0,
    }))
    .sort(
      (left, right) =>
        right.survivalCount - left.survivalCount ||
        NAME_COLLATOR.compare(left.name, right.name) ||
        (left.participantId < right.participantId
          ? -1
          : left.participantId > right.participantId
            ? 1
            : 0),
    )
}

export default rankParticipants
