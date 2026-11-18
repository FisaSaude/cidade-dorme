export {
  createMatchSession,
  dismissAnnouncement,
  setAssassinTarget,
  resolveAssassinsPhase,
  setInvestigation,
  resolveDetectivesPhase,
  startVoting,
  registerVote,
  finishManually,
} from './model/matchEngine'

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

export {
  MatchWinner,
  applyAssassinsVictoryStatuses,
  evaluateVictory,
} from './model/victory'

export {
  getAliveAssassins,
  getAliveDetectives,
  getAliveParticipants,
  getDeadParticipants,
  getEligibleTargets,
  getParticipantById,
} from './model/matchSession'

export {
  createMatchRepository,
  matchRepository,
} from './api/matchRepository'

export { default as MatchOutcomeBadge } from './ui/MatchOutcomeBadge'
