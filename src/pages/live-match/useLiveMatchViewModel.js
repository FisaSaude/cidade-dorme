import { useCallback, useMemo, useState } from 'react'
import { MatchPhase } from '@/entities/match/model/matchPhases'
import {
  getAliveParticipants,
  getDeadParticipants,
} from '@/entities/match/model/matchSession'
import { MatchStatus } from '@/entities/match/model/matchStatus'
import { getGameRuleErrorMessage } from '@/shared/config/labels'
import { formatDateTimePtBr } from '@/shared/lib/date'
import { ApiError, GameRuleError } from '@/shared/lib/errors'
import { useAsyncData } from '@/shared/lib/useAsyncData'
import { getAssassinRows } from '@/features/assassins-phase/model/assassinRows'
import { getDawnResult } from '@/features/dawn-and-voting/model/dawnResult'
import { getVotingOptions } from '@/features/dawn-and-voting/model/votingOptions'
import { getDetectiveRows } from '@/features/detectives-phase/model/detectiveRows'
import {
  closeClosureDialog,
  createClosureState,
  openClosureDialog,
} from '@/features/match-closure/model/closure'
import { getAnnouncementText } from '@/features/special-announcement/model/announcements'

const NEXT_STEP_BY_PHASE = Object.freeze({
  [MatchPhase.TURN_START]: 'Anúncio dos assassinos',
  [MatchPhase.ASSASSINS_ANNOUNCEMENT]: 'Ações dos assassinos',
  [MatchPhase.ASSASSINS_ACTIONS]: 'Processar noite',
  [MatchPhase.DETECTIVES_ANNOUNCEMENT]: 'Investigações dos detetives',
  [MatchPhase.DETECTIVES_ACTIONS]: 'Cidade acorda',
  [MatchPhase.DAWN_ANNOUNCEMENT]: 'Resultado da noite',
  [MatchPhase.DAWN_RESULT]: 'Votação',
  [MatchPhase.VOTING]: 'Próximo turno',
  [MatchPhase.FINISHED]: 'Partida encerrada',
})

function toMessage(error) {
  if (error instanceof GameRuleError) {
    return getGameRuleErrorMessage(error.code)
  }
  return 'Não foi possível concluir a operação. Tente novamente.'
}

function toPersistenceMessage(error) {
  if (!error) {
    return ''
  }

  if (error instanceof ApiError) {
    return error.message
  }

  return 'Não foi possível salvar a partida. Tente novamente.'
}

export function useLiveMatchViewModel({ session, participantRepository, actions }) {
  const loadParticipants = useCallback(() => participantRepository.list(), [participantRepository])
  const { data } = useAsyncData(loadParticipants)
  const [error, setError] = useState('')
  const [closureState, setClosureState] = useState(() => createClosureState())

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
  const dawnResult = useMemo(
    () => (session ? getDawnResult(session, participantNames) : null),
    [participantNames, session],
  )
  const votingOptions = useMemo(
    () => (session ? getVotingOptions(session, participantNames) : []),
    [participantNames, session],
  )
  const finalResult = useMemo(() => {
    if (!session || session.match.status !== MatchStatus.FINISHED) {
      return null
    }

    const resolveName = (participantId) =>
      participantNames[participantId] ?? 'Participante sem nome'

    return {
      winner: session.match.winner,
      closureReason: session.match.closureReason,
      turnCount: session.match.turnCount,
      endedAt: session.match.endedAt,
      endedAtLabel: session.match.endedAt
        ? formatDateTimePtBr(session.match.endedAt)
        : '',
      survivors: getAliveParticipants(session).map((participant) => ({
        participantId: participant.participantId,
        name: resolveName(participant.participantId),
        role: participant.role,
      })),
      eliminated: getDeadParticipants(session).map((participant) => ({
        participantId: participant.participantId,
        name: resolveName(participant.participantId),
        role: participant.role,
        eliminatedAt: participant.eliminatedAt,
      })),
    }
  }, [participantNames, session])

  const persistence = {
    state: actions.persistence?.state ?? 'idle',
    error: toPersistenceMessage(actions.persistence?.error),
    savedMatchId: actions.persistence?.savedMatchId ?? null,
  }

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
    startVoting: () => {
      try {
        setError('')
        actions.startVoting()
      } catch (actionError) {
        setError(toMessage(actionError))
      }
    },
    registerVote: (result) => {
      try {
        setError('')
        actions.registerVote(result)
      } catch (actionError) {
        setError(toMessage(actionError))
      }
    },
    retryPersistMatch: () => {
      try {
        setError('')
        actions.retryPersistMatch?.()
      } catch (actionError) {
        setError(toMessage(actionError))
      }
    },
    openFinishConfirm: () => {
      setClosureState((current) => openClosureDialog(current))
    },
    closeFinishConfirm: () => {
      setClosureState((current) => closeClosureDialog(current))
    },
    finishManually: () => {
      try {
        setError('')
        actions.finishManually()
        setClosureState((current) => closeClosureDialog(current))
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
      dawnResult,
      votingOptions,
      finalResult,
      persistence,
      nextStepLabel: session ? NEXT_STEP_BY_PHASE[session.phase] ?? '' : '',
      error,
      assassinTargets: session?.assassinTargets ?? {},
      investigations: session?.investigations ?? {},
      closure: closureState,
    },
    actions: viewActions,
  }
}

export default useLiveMatchViewModel
