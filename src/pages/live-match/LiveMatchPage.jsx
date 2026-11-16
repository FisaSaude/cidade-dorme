import { MatchPhase } from '@/entities/match/model/matchPhases'
import { AssassinsPhasePanel } from '@/features/assassins-phase/ui/AssassinsPhasePanel'
import { DawnResultPanel } from '@/features/dawn-and-voting/ui/DawnResultPanel'
import { VotingPanel } from '@/features/dawn-and-voting/ui/VotingPanel'
import { DetectivesPhasePanel } from '@/features/detectives-phase/ui/DetectivesPhasePanel'
import { FinishMatchButton } from '@/features/match-closure/ui/FinishMatchButton'
import { SpecialAnnouncement } from '@/features/special-announcement/ui/SpecialAnnouncement'
import { Alert } from '@/shared/ui/Alert'
import { EmptyState } from '@/shared/ui/EmptyState'
import { MatchStatusBar } from '@/widgets/match-status-bar/MatchStatusBar'
import { MatchSummary } from '@/widgets/match-summary/MatchSummary'
import { useLiveMatchViewModel } from './useLiveMatchViewModel'
import styles from './LiveMatchPage.module.css'

/**
 * Visão mínima da partida em andamento. As fases completas são adicionadas
 * pelas histórias de condução do turno.
 * @param {{
 *   session: object | null,
 *   participantRepository?: { list: () => Promise<Array<{ id: string, name: string }>> },
 *   actions?: {
 *     dismissAnnouncement?: () => void,
 *     setAssassinTarget?: (actorId: string, targetId: string | null) => void,
 *     resolveAssassinsPhase?: () => void,
 *     setInvestigation?: (detectiveId: string, targetId: string | null) => void,
 *     resolveDetectivesPhase?: () => void,
 *     startVoting?: () => void,
 *     registerVote?: (result: object) => void,
 *     finishManually?: () => void,
 *     retryPersistMatch?: () => void,
 *     persistence?: { state?: string, error?: unknown, savedMatchId?: string | null },
 *   },
 * }} props
 */
export function LiveMatchPage({
  session,
  participantRepository = { list: async () => [] },
  actions = {},
}) {
  const { viewState, actions: vmActions } = useLiveMatchViewModel({
    session,
    participantRepository,
    actions,
  })

  if (!session) {
    return (
      <EmptyState
        title="Nenhuma partida em andamento"
        description="Configure uma nova partida para começar."
      />
    )
  }

  const isAnnouncement = Boolean(viewState.announcement)

  return (
    <section className={styles.page} aria-labelledby="live-match-status-title">
      <h2 id="live-match-status-title" className={styles.title}>
        Partida em andamento
      </h2>
      <MatchStatusBar session={session} nextStepLabel={viewState.nextStepLabel} />

      {session.phase !== MatchPhase.FINISHED ? (
        <FinishMatchButton
          confirmOpen={viewState.closure.isConfirmOpen}
          onOpen={vmActions.openFinishConfirm}
          onCancel={vmActions.closeFinishConfirm}
          onConfirm={vmActions.finishManually}
        />
      ) : null}

      {viewState.error ? <Alert tone="error" title={viewState.error} /> : null}

      {session.phase === MatchPhase.FINISHED && viewState.finalResult ? (
        <MatchSummary
          result={viewState.finalResult}
          persistence={viewState.persistence}
          onRetry={vmActions.retryPersistMatch}
        />
      ) : null}

      {session.phase === MatchPhase.ASSASSINS_ACTIONS ? (
        <AssassinsPhasePanel
          rows={viewState.assassinRows}
          selectedTargets={viewState.assassinTargets}
          onChangeTarget={vmActions.setAssassinTarget}
          onResolve={vmActions.resolveAssassinsPhase}
        />
      ) : null}

      {session.phase === MatchPhase.DETECTIVES_ACTIONS ? (
        <DetectivesPhasePanel
          rows={viewState.detectiveRows}
          selectedInvestigations={viewState.investigations}
          onChangeTarget={vmActions.setInvestigation}
          onResolve={vmActions.resolveDetectivesPhase}
        />
      ) : null}

      {session.phase === MatchPhase.DAWN_RESULT ? (
        <DawnResultPanel
          result={viewState.dawnResult}
          onProceed={vmActions.startVoting}
        />
      ) : null}

      {session.phase === MatchPhase.VOTING ? (
        <VotingPanel
          options={viewState.votingOptions}
          onRegisterVote={vmActions.registerVote}
        />
      ) : null}

      {isAnnouncement ? (
        <SpecialAnnouncement
          phase={session.phase}
          onDismiss={vmActions.dismissAnnouncement}
          footerAction={
            <FinishMatchButton
              compact
              renderDialog={false}
              confirmOpen={viewState.closure.isConfirmOpen}
              onOpen={vmActions.openFinishConfirm}
              onCancel={vmActions.closeFinishConfirm}
              onConfirm={vmActions.finishManually}
            />
          }
        />
      ) : null}
    </section>
  )
}

export default LiveMatchPage
