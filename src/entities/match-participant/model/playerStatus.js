/**
 * Status possíveis de um participante durante a partida.
 */
export const PlayerStatus = Object.freeze({
  ALIVE: 'ALIVE',
  DEAD: 'DEAD',
})

export const PLAYER_STATUS_VALUES = Object.freeze(Object.values(PlayerStatus))

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isPlayerStatus(value) {
  return PLAYER_STATUS_VALUES.includes(value)
}

export default PlayerStatus
