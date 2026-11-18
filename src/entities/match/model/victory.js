import {
  eliminateMatchParticipant,
  PlayerRole,
  PlayerStatus,
} from '@/entities/match-participant'
import { EliminationPhase } from './matchPhases'

/**
 * Resultados possíveis de uma partida decidida por vitória.
 */
export const MatchWinner = Object.freeze({
  INNOCENTS: 'INNOCENTS',
  ASSASSINS: 'ASSASSINS',
})

/**
 * Avalia a condição de vitória de uma sessão.
 * Ordem: zero assassinos vivos → inocentes; assassinos em paridade/superioridade → assassinos.
 * @param {{ match: { participants: Array<{ role: string, status: string }> } }} session
 * @returns {'INNOCENTS' | 'ASSASSINS' | null}
 */
export function evaluateVictory(session) {
  const participants = session?.match?.participants ?? []
  const alive = participants.filter(
    (participant) => participant.status === PlayerStatus.ALIVE,
  )

  const aliveAssassins = alive.filter(
    (participant) => participant.role === PlayerRole.ASSASSIN,
  ).length
  const aliveInnocents = alive.filter(
    (participant) => participant.role === PlayerRole.INNOCENT,
  ).length
  const aliveDetectives = alive.filter(
    (participant) => participant.role === PlayerRole.DETECTIVE,
  ).length

  if (aliveAssassins === 0) {
    return MatchWinner.INNOCENTS
  }

  if (aliveAssassins >= aliveInnocents + aliveDetectives) {
    return MatchWinner.ASSASSINS
  }

  return null
}

/**
 * Aplica o status final da vitória dos assassinos sem reavaliar a vitória.
 * Não assassinos vivos são eliminados no turno/fase informados; mortos e
 * assassinos permanecem como estão.
 * @param {{ currentTurn: number, match: { participants: Array<object> } }} session
 * @param {'NIGHT' | 'VOTE'} phase
 * @returns {object}
 */
export function applyAssassinsVictoryStatuses(session, phase) {
  if (
    phase !== EliminationPhase.NIGHT &&
    phase !== EliminationPhase.VOTE
  ) {
    throw new TypeError('Assassins victory phase must be NIGHT or VOTE.')
  }

  const eliminatedAt = { turn: session.currentTurn, phase }
  const participants = session.match.participants.map((participant) => {
    if (participant.role === PlayerRole.ASSASSIN) {
      return participant
    }

    if (participant.status !== PlayerStatus.ALIVE) {
      return participant
    }

    return eliminateMatchParticipant(participant, eliminatedAt)
  })

  return {
    ...session,
    match: {
      ...session.match,
      participants,
    },
  }
}

export default evaluateVictory
