import { useCallback, useMemo, useState } from 'react'
import {
  buildHistoryDetail,
  buildHistoryList,
  createParticipantNameMap,
  getFinishedMatches,
} from '@/features/match-history/model/history'
import {
  cancelMatchDeletion,
  createMatchDeletionState,
  getMatchDeletionDecision,
  isAlreadyRemoved,
  requestMatchDeletion,
  shouldCloseDetail,
} from '@/features/match-deletion/model/matchDeletion'
import {
  DEFAULT_ERROR_MESSAGE,
  uiMessages,
} from '@/shared/config/labels'
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
 * ViewModel da página de histórico: carrega, detalha e exclui partidas finalizadas.
 * @param {{
 *   matchRepository: { listFinished: Function, deleteMatch?: Function },
 *   participantRepository: { list?: Function, listAll?: Function },
 * }} repositories
 */
export function useHistoryViewModel({ matchRepository, participantRepository }) {
  if (!matchRepository || !participantRepository) {
    throw new Error('matchRepository and participantRepository are required.')
  }

  const load = useCallback(async () => {
    const listParticipants =
      typeof participantRepository.listAll === 'function'
        ? participantRepository.listAll()
        : participantRepository.list()

    const [matches, participants] = await Promise.all([
      matchRepository.listFinished(),
      listParticipants,
    ])

    return { matches, participants }
  }, [matchRepository, participantRepository])

  const { data, error, loading, retry } = useAsyncData(load)
  const [selectedMatchId, setSelectedMatchId] = useState(null)
  const [deletionState, setDeletionState] = useState(() =>
    createMatchDeletionState(),
  )
  const [deletionError, setDeletionError] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [notice, setNotice] = useState('')

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
  const pendingMatch = useMemo(
    () =>
      finishedMatches.find(
        (match) => match.id === deletionState.pendingMatchId,
      ) ?? null,
    [deletionState.pendingMatchId, finishedMatches],
  )
  const pendingItem = useMemo(
    () => items.find((item) => item.id === deletionState.pendingMatchId) ?? null,
    [deletionState.pendingMatchId, items],
  )
  const detail = useMemo(
    () => (selectedMatch ? buildHistoryDetail(selectedMatch, nameMap) : null),
    [nameMap, selectedMatch],
  )

  const deletionDecision = pendingMatch
    ? getMatchDeletionDecision(pendingMatch)
    : { allowed: true, code: null, message: '' }

  const selectMatch = useCallback((matchId) => {
    setSelectedMatchId(matchId)
  }, [])

  const closeDetail = useCallback(() => {
    setSelectedMatchId(null)
  }, [])

  const requestDelete = useCallback((matchId) => {
    setDeletionError('')
    setNotice('')
    setDeletionState((current) => requestMatchDeletion(current, matchId))
  }, [])

  const cancelDelete = useCallback(() => {
    setDeletionError('')
    setDeletionState((current) => cancelMatchDeletion(current))
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!pendingMatch || deletingId) {
      return
    }

    const decision = getMatchDeletionDecision(pendingMatch)

    if (!decision.allowed) {
      setDeletionError(decision.message)
      return
    }

    if (typeof matchRepository.deleteMatch !== 'function') {
      setDeletionError(uiMessages.matchDeletionFailure)
      return
    }

    const deletedMatchId = pendingMatch.id
    setDeletingId(deletedMatchId)
    setDeletionError('')
    setNotice('')

    try {
      await matchRepository.deleteMatch(deletedMatchId)
      setNotice(uiMessages.matchDeletionSuccess)
    } catch (deleteError) {
      if (isAlreadyRemoved(deleteError)) {
        setNotice(uiMessages.matchDeletionAlreadyRemoved)
      } else {
        setDeletionError(toUserMessage(deleteError))
        setDeletingId(null)
        return
      }
    }

    if (shouldCloseDetail({ deletedMatchId, selectedMatchId })) {
      setSelectedMatchId(null)
    }

    setDeletionState((current) => cancelMatchDeletion(current))
    setDeletingId(null)
    retry()
  }, [deletingId, matchRepository, pendingMatch, retry, selectedMatchId])

  const loadError = error ? toUserMessage(error) : ''

  return {
    viewState: {
      items,
      detail,
      selectedMatchId,
      loading,
      error: loadError,
      notice,
      empty: !loading && !loadError && items.length === 0,
      deletion: {
        open: Boolean(pendingMatch),
        match: pendingMatch,
        item: pendingItem,
        blockedMessage: deletionDecision.allowed ? '' : deletionDecision.message,
        error: deletionError,
        deletingId,
      },
    },
    actions: {
      selectMatch,
      closeDetail,
      retry,
      requestDelete,
      cancelDelete,
      confirmDelete,
    },
  }
}

export default useHistoryViewModel
