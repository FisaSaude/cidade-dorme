import { describe, expect, it } from 'vitest'
import { PlayerRole } from '@/entities/match-participant/model/playerRole'
import { PlayerStatus } from '@/entities/match-participant/model/playerStatus'
import { evaluateVictory, MatchWinner } from '@/entities/match/model/victory'
import {
  makeMatchParticipant,
  makeParticipants,
  makeSession,
} from '../fixtures/sessionBuilder'

function makeSessionFrom(entries) {
  const participants = entries.map((entry, index) =>
    makeMatchParticipant({
      index: index + 1,
      role: entry.role,
      status: entry.status ?? PlayerStatus.ALIVE,
    }),
  )

  return makeSession({ participants })
}

describe('evaluateVictory', () => {
  it('declara vitória dos inocentes quando não há assassinos vivos', () => {
    const session = makeSessionFrom([
      { role: PlayerRole.INNOCENT },
      { role: PlayerRole.INNOCENT },
      { role: PlayerRole.DETECTIVE },
      { role: PlayerRole.ASSASSIN, status: PlayerStatus.DEAD },
    ])

    expect(evaluateVictory(session)).toBe(MatchWinner.INNOCENTS)
  })

  it('declara vitória dos assassinos em paridade', () => {
    const session = makeSessionFrom([
      { role: PlayerRole.ASSASSIN },
      { role: PlayerRole.ASSASSIN },
      { role: PlayerRole.INNOCENT },
      { role: PlayerRole.DETECTIVE, status: PlayerStatus.DEAD },
    ])

    expect(evaluateVictory(session)).toBe(MatchWinner.ASSASSINS)
  })

  it('declara vitória dos assassinos em superioridade', () => {
    const session = makeSessionFrom([
      { role: PlayerRole.ASSASSIN },
      { role: PlayerRole.ASSASSIN },
      { role: PlayerRole.INNOCENT },
      { role: PlayerRole.INNOCENT, status: PlayerStatus.DEAD },
    ])

    expect(evaluateVictory(session)).toBe(MatchWinner.ASSASSINS)
  })

  it('mantém a partida em continuação quando os inocentes superam os assassinos', () => {
    const session = makeSessionFrom([
      { role: PlayerRole.ASSASSIN },
      { role: PlayerRole.INNOCENT },
      { role: PlayerRole.INNOCENT },
      { role: PlayerRole.DETECTIVE },
    ])

    expect(evaluateVictory(session)).toBeNull()
  })

  it('prioriza a ausência de assassinos vivos sobre as demais condições', () => {
    const session = makeSessionFrom([
      { role: PlayerRole.INNOCENT, status: PlayerStatus.DEAD },
      { role: PlayerRole.ASSASSIN, status: PlayerStatus.DEAD },
    ])

    expect(evaluateVictory(session)).toBe(MatchWinner.INNOCENTS)
  })

  it('considera uma sessão válida de cinco participantes', () => {
    const session = makeSession({
      participants: makeParticipants([
        PlayerRole.ASSASSIN,
        PlayerRole.INNOCENT,
        PlayerRole.INNOCENT,
        PlayerRole.DETECTIVE,
        PlayerRole.INNOCENT,
      ]),
    })

    expect(evaluateVictory(session)).toBeNull()
  })
})
