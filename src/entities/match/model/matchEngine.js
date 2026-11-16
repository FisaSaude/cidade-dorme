import { PlayerRole } from '@/entities/match-participant/model/playerRole'
import {
  createMatchParticipant,
  eliminateMatchParticipant,
  isMatchParticipantAlive,
} from '@/entities/match-participant/model/matchParticipant'
import { GameRuleError } from '@/shared/lib/errors'
import { validateMatchConfiguration } from './matchConfiguration'
import { getNextAnnouncementPhase, MatchPhase } from './matchPhases'
import { MatchClosureReason, MatchStatus } from './matchStatus'
import { MatchWinner, evaluateVictory } from './victory'
import {
  getAliveDetectives,
  getParticipantById,
} from './matchSession'

/**
 * Cria a sessão inicial de uma partida. Não muta a configuração recebida.
 * @param {{ participants?: Array<{ participantId?: unknown, role?: unknown }> }} configuration
 * @param {{ matchId?: string, startedAt?: string, idFactory?: () => string }} [context]
 * @returns {object}
 */
export function createMatchSession(configuration, context = {}) {
  const normalized = validateMatchConfiguration(configuration)
  const { matchId, startedAt, idFactory } = context

  if (typeof matchId !== 'string' || !matchId.trim()) {
    throw new TypeError('matchId is required to create a match session.')
  }

  if (typeof startedAt !== 'string' || !startedAt.trim()) {
    throw new TypeError('startedAt is required to create a match session.')
  }

  if (typeof idFactory !== 'function') {
    throw new TypeError('idFactory is required to create a match session.')
  }

  const participants = normalized.participants.map(({ participantId, role }) =>
    createMatchParticipant({ id: idFactory(), participantId, role }),
  )

  return {
    match: {
      id: matchId,
      status: MatchStatus.IN_PROGRESS,
      closureReason: null,
      winner: null,
      startedAt,
      endedAt: null,
      turnCount: 0,
      participants,
    },
    phase: MatchPhase.TURN_START,
    currentTurn: 1,
    assassinTargets: {},
    investigations: {},
    nightResult: null,
    voteResult: null,
  }
}

function assertPhase(session, expectedPhase) {
  if (session.phase !== expectedPhase) {
    throw new GameRuleError(
      'INVALID_PHASE',
      `Expected phase ${expectedPhase}, got ${session.phase}.`,
    )
  }
}

function resolveParticipant(session, id) {
  return getParticipantById(session, id)
}

function assertAliveActor(actor) {
  if (!actor || !isMatchParticipantAlive(actor)) {
    throw new GameRuleError('ACTOR_NOT_ALIVE')
  }
}

function assertTarget(session, actor, targetId) {
  const target = resolveParticipant(session, targetId)

  if (!target || !isMatchParticipantAlive(target)) {
    throw new GameRuleError('TARGET_NOT_ALIVE')
  }

  if (
    target.id === actor.id ||
    target.participantId === actor.id ||
    target.id === actor.participantId ||
    target.participantId === actor.participantId
  ) {
    throw new GameRuleError('TARGET_IS_SELF')
  }

  return target
}

function finishWithVictory(session, winner, endedAt) {
  if (!endedAt || typeof endedAt !== 'string') {
    throw new TypeError('endedAt is required when finishing with victory.')
  }

  return {
    ...session,
    phase: MatchPhase.FINISHED,
    match: {
      ...session.match,
      status: MatchStatus.FINISHED,
      closureReason: MatchClosureReason.VICTORY,
      winner,
      endedAt,
      turnCount: session.match.turnCount + 1,
    },
  }
}

export function dismissAnnouncement(session) {
  const nextPhase = getNextAnnouncementPhase(session.phase)
  return {
    ...session,
    phase: nextPhase,
  }
}

export function setAssassinTarget(session, actorId, targetId) {
  assertPhase(session, MatchPhase.ASSASSINS_ACTIONS)

  const actor = resolveParticipant(session, actorId)
  assertAliveActor(actor)

  if (actor.role !== PlayerRole.ASSASSIN) {
    throw new GameRuleError('INVALID_ACTOR_ROLE')
  }

  if (targetId == null) {
    return {
      ...session,
      assassinTargets: {
        ...session.assassinTargets,
        [actor.id]: null,
      },
    }
  }

  const target = assertTarget(session, actor, targetId)

  return {
    ...session,
    assassinTargets: {
      ...session.assassinTargets,
      [actor.id]: target.id,
    },
  }
}

export function resolveAssassinsPhase(session, endedAt) {
  assertPhase(session, MatchPhase.ASSASSINS_ACTIONS)

  const chosenTargetIds = Array.from(
    new Set(Object.values(session.assassinTargets ?? {}).filter(Boolean)),
  )

  const eliminatedIds = []
  const participants = session.match.participants.map((participant) => {
    if (!chosenTargetIds.includes(participant.id) || !isMatchParticipantAlive(participant)) {
      return participant
    }

    eliminatedIds.push(participant.participantId)
    return eliminateMatchParticipant(participant, {
      turn: session.currentTurn,
      phase: 'NIGHT',
    })
  })

  const withNightResult = {
    ...session,
    assassinTargets: {},
    investigations: {},
    nightResult: {
      eliminatedParticipantIds: eliminatedIds,
    },
    match: {
      ...session.match,
      participants,
    },
  }

  const winner = evaluateVictory(withNightResult)

  if (winner === MatchWinner.INNOCENTS || winner === MatchWinner.ASSASSINS) {
    return finishWithVictory(withNightResult, winner, endedAt)
  }

  return {
    ...withNightResult,
    phase:
      getAliveDetectives(withNightResult).length > 0
        ? MatchPhase.DETECTIVES_ANNOUNCEMENT
        : MatchPhase.DAWN_ANNOUNCEMENT,
  }
}

export function setInvestigation(session, detectiveId, targetId) {
  assertPhase(session, MatchPhase.DETECTIVES_ACTIONS)

  const actor = resolveParticipant(session, detectiveId)
  assertAliveActor(actor)

  if (actor.role !== PlayerRole.DETECTIVE) {
    throw new GameRuleError('INVALID_ACTOR_ROLE')
  }

  if (targetId == null) {
    return {
      ...session,
      investigations: {
        ...session.investigations,
        [actor.id]: null,
      },
    }
  }

  const target = assertTarget(session, actor, targetId)

  return {
    ...session,
    investigations: {
      ...session.investigations,
      [actor.id]: {
        targetId: target.id,
        revealedRole: target.role,
      },
    },
  }
}

export function resolveDetectivesPhase(session) {
  assertPhase(session, MatchPhase.DETECTIVES_ACTIONS)

  return {
    ...session,
    phase: MatchPhase.DAWN_ANNOUNCEMENT,
  }
}

export default createMatchSession
