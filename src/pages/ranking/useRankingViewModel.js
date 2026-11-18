import { useCallback, useMemo } from 'react'
import { rankParticipants } from '@/features/participant-ranking/model/ranking'
import { DEFAULT_ERROR_MESSAGE } from '@/shared/config/labels'
import { ApiError } from '@/shared/lib/errors'
import { useAsyncData } from '@/shared/lib/useAsyncData'

/**
 * @param {unknown} error
 * @returns {string}
 */
function toUserMessage(error) {
  if (error instanceof ApiError) {
    return error.message || DEFAULT_ERROR_MESSAGE
  }

  return DEFAULT_ERROR_MESSAGE
}

/**
 * ViewModel do ranking: carrega participantes e partidas finalizadas e deriva
 * as sobrevivências de cada participante cadastrado.
 * @param {{
 *   matchRepository: { listFinished: Function },
 *   participantRepository: { list: Function, listAll?: Function },
 * }} repositories
 */
export function useRankingViewModel({
  matchRepository,
  participantRepository,
}) {
  if (!matchRepository || !participantRepository) {
    throw new Error('matchRepository and participantRepository are required.')
  }

  const load = useCallback(async () => {
    const loadParticipants =
      typeof participantRepository.listAll === 'function'
        ? participantRepository.listAll()
        : participantRepository.list()

    const [participants, matches] = await Promise.all([
      loadParticipants,
      matchRepository.listFinished(),
    ])

    return { participants, matches }
  }, [matchRepository, participantRepository])

  const { data, error, loading, retry } = useAsyncData(load)

  const items = useMemo(
    () => rankParticipants(data?.participants, data?.matches),
    [data],
  )
  const loadError = error ? toUserMessage(error) : ''

  return {
    viewState: {
      items,
      loading,
      error: loadError,
      empty: !loading && !loadError && items.length === 0,
    },
    actions: {
      retry,
    },
  }
}

export default useRankingViewModel
