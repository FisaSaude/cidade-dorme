import { useCallback, useMemo, useState } from 'react'
import {
  buildHistoryDetail,
  buildHistoryList,
  createParticipantNameMap,
  getFinishedMatches,
} from '@/features/match-history/model/history'
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
 * ViewModel da página de histórico: carrega partidas finalizadas e participantes.
 * @param {{
 *   matchRepository: { listFinished: Function },
 *   participantRepository: { list: Function },
 * }} repositories
 */
export function useHistoryViewModel({ matchRepository, participantRepository }) {
  if (!matchRepository || !participantRepository) {
    throw new Error('matchRepository and participantRepository are required.')
  }

  const load = useCallback(async () => {
    const [matches, participants] = await Promise.all([
      matchRepository.listFinished(),
      participantRepository.list(),
    ])

    return { matches, participants }
  }, [matchRepository, participantRepository])

  const { data, error, loading, retry } = useAsyncData(load)
  const [selectedMatchId, setSelectedMatchId] = useState(null)

  const nameMap = useMemo(
    () => createParticipantNameMap(data?.participants),
    [data],
  )
  const finishedMatches = useMemo(
    () => getFinishedMatches(data?.matches),
    [data],
  )
  const items = useMemo(
    () => buildHistoryList(finishedMatches, nameMap),
    [finishedMatches, nameMap],
  )
  const selectedMatch = useMemo(
    () =>
      finishedMatches.find((match) => match.id === selectedMatchId) ?? null,
    [finishedMatches, selectedMatchId],
  )
  const detail = useMemo(
    () => (selectedMatch ? buildHistoryDetail(selectedMatch, nameMap) : null),
    [nameMap, selectedMatch],
  )

  const selectMatch = useCallback((matchId) => {
    setSelectedMatchId(matchId)
  }, [])

  const closeDetail = useCallback(() => {
    setSelectedMatchId(null)
  }, [])

  const loadError = error ? toUserMessage(error) : ''

  return {
    viewState: {
      items,
      detail,
      selectedMatchId,
      loading,
      error: loadError,
      empty: !loading && !loadError && items.length === 0,
    },
    actions: {
      selectMatch,
      closeDetail,
      retry,
    },
  }
}

export default useHistoryViewModel
