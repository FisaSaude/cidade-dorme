import { useCallback, useMemo, useState } from 'react'
import { MatchPhase } from '@/entities/match/model/matchPhases'
import { getGameRuleErrorMessage } from '@/shared/config/labels'
import { GameRuleError } from '@/shared/lib/errors'
import { useAsyncData } from '@/shared/lib/useAsyncData'
import { getAssassinRows } from '@/features/assassins-phase/model/assassinRows'
import { getDetectiveRows } from '@/features/detectives-phase/model/detectiveRows'
import { getAnnouncementText } from '@/features/special-announcement/model/announcements'

const NEXT_STEP_BY_PHASE = Object.freeze({
  [MatchPhase.TURN_START]: 'Anúncio dos assassinos',
  [MatchPhase.ASSASSINS_ANNOUNCEMENT]: 'Ações dos assassinos',
  [MatchPhase.ASSASSINS_ACTIONS]: 'Processar noite',
  [MatchPhase.DETECTIVES_ANNOUNCEMENT]: 'Investigações dos detetives',
  [MatchPhase.DETECTIVES_ACTIONS]: 'Cidade acorda',
  [MatchPhase.DAWN_ANNOUNCEMENT]: 'Resultado da noite',
})

function toMessage(error) {
  if (error instanceof GameRuleError) {
    return getGameRuleErrorMessage(error.code)
  }
  return 'Não foi possível concluir a operação. Tente novamente.'
}

export function useLiveMatchViewModel({ session, participantRepository, actions }) {
  const loadParticipants = useCallback(() => participantRepository.list(), [participantRepository])
  const { data } = useAsyncData(loadParticipants)
  const [error, setError] = useState('')

  const participantNames = useMemo(() => {
    const entries = (data ?? []).map((participant) => [participant.id, participant.name])
    return Object.fromEntries(entries)
  }, [data])

  const announcement = session ? getAnnouncementText(session.phase) : ''
  const assassinRows = useMemo(
    () => (session ? getAssassinRows(session, participantNames) : []),
    [participantNames, session],
  )
  const detectiveRows = useMemo(
    () => (session ? getDetectiveRows(session, participantNames) : []),
    [participantNames, session],
  )

  const viewActions = {
    dismissAnnouncement: () => {
      try {
        setError('')
        actions.dismissAnnouncement()
      } catch (actionError) {
        setError(toMessage(actionError))
      }
    },
    setAssassinTarget: (actorId, targetId) => {
      try {
        setError('')
        actions.setAssassinTarget(actorId, targetId)
      } catch (actionError) {
        setError(toMessage(actionError))
      }
    },
    resolveAssassinsPhase: () => {
      try {
        setError('')
        actions.resolveAssassinsPhase()
      } catch (actionError) {
        setError(toMessage(actionError))
      }
    },
    setInvestigation: (detectiveId, targetId) => {
      try {
        setError('')
        actions.setInvestigation(detectiveId, targetId)
      } catch (actionError) {
        setError(toMessage(actionError))
      }
    },
    resolveDetectivesPhase: () => {
      try {
        setError('')
        actions.resolveDetectivesPhase()
      } catch (actionError) {
        setError(toMessage(actionError))
      }
    },
  }

  return {
    viewState: {
      announcement,
      assassinRows,
      detectiveRows,
      nextStepLabel: session ? NEXT_STEP_BY_PHASE[session.phase] ?? '' : '',
      error,
      assassinTargets: session?.assassinTargets ?? {},
      investigations: session?.investigations ?? {},
    },
    actions: viewActions,
  }
}

export default useLiveMatchViewModel
