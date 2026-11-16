import { describe, expect, it } from 'vitest'
import { setAssassinTarget } from '@/entities/match/model/matchEngine'
import { MatchPhase } from '@/entities/match/model/matchPhases'
import { PlayerRole } from '@/entities/match-participant/model/playerRole'
import { PlayerStatus } from '@/entities/match-participant/model/playerStatus'
import { makeParticipants, makeValidSession } from '../fixtures/sessionBuilder'

function expectCode(action, code) {
  try {
    action()
  } catch (error) {
    expect(error.code).toBe(code)
    return
  }

  throw new Error(`Expected GameRuleError with code ${code}.`)
}

function makeSession() {
  const participants = makeParticipants([
    PlayerRole.ASSASSIN,
    PlayerRole.ASSASSIN,
    PlayerRole.DETECTIVE,
    PlayerRole.INNOCENT,
    PlayerRole.INNOCENT,
  ])

  return makeValidSession({ phase: MatchPhase.ASSASSINS_ACTIONS, participants })
}

describe('matchEngine setAssassinTarget', () => {
  it('aceita alvo nulo (ação opcional)', () => {
    const session = makeSession()
    const next = setAssassinTarget(session, 'mp-1', null)
    expect(next.assassinTargets['mp-1']).toBeNull()
  })

  it('rejeita ator morto', () => {
    const session = makeSession()
    session.match.participants[0].status = PlayerStatus.DEAD
    session.match.participants[0].eliminatedAt = { turn: 1, phase: 'NIGHT' }

    expectCode(() => setAssassinTarget(session, 'mp-1', 'mp-4'), 'ACTOR_NOT_ALIVE')
  })

  it('rejeita ator sem papel assassino', () => {
    const session = makeSession()
    expectCode(() => setAssassinTarget(session, 'mp-3', 'mp-4'), 'INVALID_ACTOR_ROLE')
  })

  it('rejeita alvo morto', () => {
    const session = makeSession()
    session.match.participants[3].status = PlayerStatus.DEAD
    session.match.participants[3].eliminatedAt = { turn: 1, phase: 'NIGHT' }

    expectCode(() => setAssassinTarget(session, 'mp-1', 'mp-4'), 'TARGET_NOT_ALIVE')
  })

  it('rejeita alvo igual ao ator', () => {
    const session = makeSession()
    expectCode(() => setAssassinTarget(session, 'mp-1', 'mp-1'), 'TARGET_IS_SELF')
  })

  it('permite alvo assassino e alvo repetido por assassinos diferentes', () => {
    const session = makeSession()
    const withFirst = setAssassinTarget(session, 'mp-1', 'mp-2')
    const withSecond = setAssassinTarget(withFirst, 'mp-2', 'mp-3')
    const withThird = setAssassinTarget(withSecond, 'mp-1', 'mp-3')

    expect(withFirst.assassinTargets['mp-1']).toBe('mp-2')
    expect(withSecond.assassinTargets['mp-2']).toBe('mp-3')
    expect(withThird.assassinTargets['mp-1']).toBe('mp-3')
  })
})
