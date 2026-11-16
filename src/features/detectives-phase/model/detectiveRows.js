import { getAliveDetectives, getEligibleTargets } from '@/entities/match'

export function getDetectiveRows(session, participantNames = {}) {
  return getAliveDetectives(session).map((detective) => ({
    detectiveId: detective.id,
    detectiveName: participantNames[detective.participantId] ?? detective.participantId,
    targetOptions: getEligibleTargets(session, detective.id).map((target) => ({
      value: target.id,
      label: participantNames[target.participantId] ?? target.participantId,
    })),
  }))
}

export default getDetectiveRows
