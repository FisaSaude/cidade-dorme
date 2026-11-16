import { describe, expect, it } from 'vitest'
import { dismissAnnouncement } from '@/entities/match/model/matchEngine'
import { MatchPhase } from '@/entities/match/model/matchPhases'
import { makeValidSession } from '../fixtures/sessionBuilder'

function expectCode(action, code) {
  try {
    action()
  } catch (error) {
    expect(error.code).toBe(code)
    return
  }

  throw new Error(`Expected GameRuleError with code ${code}.`)
}

describe('matchEngine dismissAnnouncement', () => {
  it('faz as quatro transições permitidas', () => {
    const phases = [
      [MatchPhase.TURN_START, MatchPhase.ASSASSINS_ANNOUNCEMENT],
      [MatchPhase.ASSASSINS_ANNOUNCEMENT, MatchPhase.ASSASSINS_ACTIONS],
      [MatchPhase.DETECTIVES_ANNOUNCEMENT, MatchPhase.DETECTIVES_ACTIONS],
      [MatchPhase.DAWN_ANNOUNCEMENT, MatchPhase.DAWN_RESULT],
    ]

    for (const [from, to] of phases) {
      const next = dismissAnnouncement(makeValidSession({ phase: from }))
      expect(next.phase).toBe(to)
      expect(next.match.status).toBe('IN_PROGRESS')
    }
  })

  it('rejeita fases não suportadas com INVALID_PHASE', () => {
    expectCode(
      () => dismissAnnouncement(makeValidSession({ phase: MatchPhase.ASSASSINS_ACTIONS })),
      'INVALID_PHASE',
    )
  })
})
