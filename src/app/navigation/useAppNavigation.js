import { useCallback, useState } from 'react'
import { DEFAULT_SCREEN, SCREENS } from './screens'

/**
 * Navegação interna da aplicação, sem roteador.
 * Bloqueia a abertura de uma nova configuração enquanto houver sessão ativa.
 * @param {{ initialScreen?: string, hasActiveSession?: boolean }} [options]
 */
export function useAppNavigation(options = {}) {
  const { initialScreen = DEFAULT_SCREEN, hasActiveSession = false } = options
  const [activeScreen, setActiveScreen] = useState(initialScreen)
  const [params, setParams] = useState(null)

  const navigate = useCallback(
    (screen, screenParams = null) => {
      if (screen === SCREENS.MATCH_SETUP && hasActiveSession) {
        return false
      }

      setActiveScreen(screen)
      setParams(screenParams)
      return true
    },
    [hasActiveSession],
  )

  return { activeScreen, params, navigate }
}

export default useAppNavigation
