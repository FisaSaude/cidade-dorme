import { PlayerRole } from '@/entities/match-participant/model/playerRole'
import { PlayerStatus } from '@/entities/match-participant/model/playerStatus'

/**
 * @param {unknown} session
 * @returns {Array<object>}
 */
function getParticipants(session) {
  return /** @type {{ match?: { participants?: Array<object> } }} */ (session)?.match
    ?.participants ?? []
}

/**
 * Participantes vivos da partida.
 * @param {unknown} session
 */
export function getAliveParticipants(session) {
  return getParticipants(session).filter(
    (participant) =>
      /** @type {{ status?: string }} */ (participant).status === PlayerStatus.ALIVE,
  )
}

/**
 * Assassinos vivos.
 * @param {unknown} session
 */
export function getAliveAssassins(session) {
  return getAliveParticipants(session).filter(
    (participant) =>
      /** @type {{ role?: string }} */ (participant).role === PlayerRole.ASSASSIN,
  )
}

/**
 * Detetives vivos.
 * @param {unknown} session
 */
export function getAliveDetectives(session) {
  return getAliveParticipants(session).filter(
    (participant) =>
      /** @type {{ role?: string }} */ (participant).role === PlayerRole.DETECTIVE,
  )
}

/**
 * Participantes eliminados.
 * @param {unknown} session
 */
export function getDeadParticipants(session) {
  return getParticipants(session).filter(
    (participant) =>
      /** @type {{ status?: string }} */ (participant).status === PlayerStatus.DEAD,
  )
}

/**
 * Busca um participante da partida por id da participação (com fallback para participantId).
 * @param {unknown} session
 * @param {string} participantId
 */
export function getParticipantById(session, participantId) {
  const participants = getParticipants(session)

  return (
    participants.find(
      (participant) => /** @type {{ id?: string }} */ (participant).id === participantId,
    ) ??
    participants.find(
      (participant) =>
        /** @type {{ participantId?: string }} */ (participant).participantId ===
        participantId,
    )
  )
}

/**
 * Alvos elegíveis para um ator: vivos, excluindo o próprio ator.
 * @param {unknown} session
 * @param {string} actorId
 */
export function getEligibleTargets(session, actorId) {
  return getAliveParticipants(session).filter(
    (participant) =>
      /** @type {{ id?: string, participantId?: string }} */ (participant).id !==
        actorId &&
      /** @type {{ id?: string, participantId?: string }} */ (participant)
        .participantId !== actorId,
  )
}
