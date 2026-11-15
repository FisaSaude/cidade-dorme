/**
 * Papéis possíveis de um participante em uma partida.
 */
export const PlayerRole = Object.freeze({
  INNOCENT: 'INNOCENT',
  ASSASSIN: 'ASSASSIN',
  DETECTIVE: 'DETECTIVE',
})

export const PLAYER_ROLE_VALUES = Object.freeze(Object.values(PlayerRole))

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isPlayerRole(value) {
  return PLAYER_ROLE_VALUES.includes(value)
}

export default PlayerRole
