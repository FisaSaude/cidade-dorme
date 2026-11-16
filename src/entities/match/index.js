export { createMatchSession } from './model/matchEngine'

export {
  MIN_PARTICIPANTS,
  createMatchConfiguration,
  normalizeConfigurationRole,
  validateMatchConfiguration,
} from './model/matchConfiguration'

export { MatchClosureReason, MatchStatus } from './model/matchStatus'

export {
  ANNOUNCEMENT_TRANSITIONS,
  EliminationPhase,
  MatchPhase,
  getNextAnnouncementPhase,
} from './model/matchPhases'

export { MatchWinner, evaluateVictory } from './model/victory'

export {
  getAliveAssassins,
  getAliveDetectives,
  getAliveParticipants,
  getDeadParticipants,
  getEligibleTargets,
  getParticipantById,
} from './model/matchSession'
