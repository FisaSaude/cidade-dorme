import { getAliveAssassins, getEligibleTargets } from '@/entities/match'

export function getAssassinRows(session, participantNames = {}) {
  return getAliveAssassins(session).map((assassin) => ({
    assassinId: assassin.id,
    assassinName: participantNames[assassin.participantId] ?? assassin.participantId,
    targetOptions: getEligibleTargets(session, assassin.id).map((target) => ({
      value: target.id,
      label: participantNames[target.participantId] ?? target.participantId,
    })),
  }))
}

export default getAssassinRows
