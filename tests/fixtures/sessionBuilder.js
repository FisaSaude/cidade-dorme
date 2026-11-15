import { PlayerRole } from '../../src/entities/match-participant/model/playerRole.js'
import { PlayerStatus } from '../../src/entities/match-participant/model/playerStatus.js'
import { MatchPhase } from '../../src/entities/match/model/matchPhases.js'

const DEFAULT_ROLES = Object.freeze([
  PlayerRole.ASSASSIN,
  PlayerRole.INNOCENT,
  PlayerRole.INNOCENT,
  PlayerRole.DETECTIVE,
  PlayerRole.INNOCENT,
])

/**
 * Cria um MatchParticipant válido para testes.
 * @param {{ index?: number, id?: string, participantId?: string, role?: string, status?: string, eliminatedAt?: object | null }} [overrides]
 */
export function makeMatchParticipant(overrides = {}) {
  const index = overrides.index ?? 1
  const status = overrides.status ?? PlayerStatus.ALIVE
  const eliminatedAt =
    overrides.eliminatedAt ??
    (status === PlayerStatus.DEAD ? { turn: 1, phase: 'NIGHT' } : null)

  return {
    id: overrides.id ?? `mp-${index}`,
    participantId: overrides.participantId ?? `participant-${index}`,
    role: overrides.role ?? PlayerRole.INNOCENT,
    status,
    eliminatedAt,
  }
}

/**
 * Cria uma lista de MatchParticipant a partir de papéis.
 * @param {string[]} [roles]
 */
export function makeParticipants(roles = DEFAULT_ROLES) {
  return roles.map((role, index) =>
    makeMatchParticipant({ index: index + 1, role }),
  )
}

/**
 * Cria um documento de Match válido para testes.
 * @param {object} [overrides]
 */
export function makeMatch(overrides = {}) {
  return {
    id: 'match-1',
    status: 'IN_PROGRESS',
    closureReason: null,
    winner: null,
    startedAt: '2026-01-01T00:00:00.000Z',
    endedAt: null,
    turnCount: 0,
    participants: makeParticipants(),
    ...overrides,
  }
}

/**
 * Cria uma sessão de partida válida (≥ 5 participantes, ≥ 1 assassino).
 * @param {{ participants?: Array<object>, phase?: string, currentTurn?: number, match?: object } & Record<string, unknown>} [overrides]
 */
export function makeSession(overrides = {}) {
  const {
    participants = makeParticipants(),
    phase = MatchPhase.TURN_START,
    currentTurn = 1,
    match = {},
    ...sessionOverrides
  } = overrides

  return {
    match: makeMatch({ participants, ...match }),
    phase,
    currentTurn,
    assassinTargets: {},
    investigations: {},
    nightResult: null,
    voteResult: null,
    ...sessionOverrides,
  }
}

/**
 * Alias explícito para sessões que atendem às regras mínimas de configuração.
 * @param {object} [overrides]
 */
export function makeValidSession(overrides = {}) {
  return makeSession(overrides)
}

/**
 * Cria uma partida finalizada para testes de histórico/ranking.
 * @param {object} [overrides]
 */
export function makeFinishedMatch(overrides = {}) {
  return makeMatch({
    status: 'FINISHED',
    closureReason: 'VICTORY',
    winner: 'INNOCENTS',
    endedAt: '2026-01-01T01:00:00.000Z',
    turnCount: 2,
    ...overrides,
  })
}
