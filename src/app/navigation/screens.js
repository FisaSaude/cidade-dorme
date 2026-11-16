export const SCREENS = Object.freeze({
  PARTICIPANTS: 'participants',
  MATCH_SETUP: 'match-setup',
  LIVE_MATCH: 'live-match',
  HISTORY: 'history',
  RANKING: 'ranking',
})

export const DEFAULT_SCREEN = SCREENS.PARTICIPANTS

export const SCREEN_LABELS = Object.freeze({
  [SCREENS.PARTICIPANTS]: 'Participantes',
  [SCREENS.MATCH_SETUP]: 'Nova partida',
  [SCREENS.LIVE_MATCH]: 'Partida',
  [SCREENS.HISTORY]: 'Histórico',
  [SCREENS.RANKING]: 'Ranking',
})

export const NAV_ITEMS = Object.freeze([
  SCREENS.PARTICIPANTS,
  SCREENS.MATCH_SETUP,
  SCREENS.HISTORY,
  SCREENS.RANKING,
])

export const ACTIVE_SESSION_NAV_ITEMS = Object.freeze([
  SCREENS.PARTICIPANTS,
  SCREENS.LIVE_MATCH,
  SCREENS.HISTORY,
  SCREENS.RANKING,
])

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isScreen(value) {
  return Object.values(SCREENS).includes(value)
}

export default SCREENS
