import { PlayerRole, PlayerStatus } from '@/entities/match-participant'

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

export default evaluateVictory
