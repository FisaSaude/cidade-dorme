import { MatchSetupForm } from '@/features/match-configuration/ui/MatchSetupForm'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { useMatchSetupViewModel } from './useMatchSetupViewModel'
import styles from './MatchSetupPage.module.css'

/**
 * Página de configuração de uma nova partida.
 * @param {{
 *   participantRepository: { list: Function },
 *   startMatch: (configuration: object) => unknown,
 *   onStarted?: () => void,
 * }} props
 */
export function MatchSetupPage({ participantRepository, startMatch, onStarted }) {
  const { viewState, actions } = useMatchSetupViewModel({
    participantRepository,
    startMatch,
    onStarted,
  })

  if (viewState.loading) {
    return <LoadingState label="Carregando participantes…" />
  }

  if (viewState.loadError) {
    return (
      <Alert tone="error" title="Falha ao carregar participantes">
        <p className={styles.alertText}>{viewState.loadError}</p>
        <Button variant="secondary" onClick={actions.retry}>
          Tentar novamente
        </Button>
      </Alert>
    )
  }

  if (viewState.participants.length === 0) {
    return (
      <EmptyState
        title="Nenhum participante cadastrado"
        description="Cadastre pelo menos cinco participantes antes de iniciar uma partida."
      />
    )
  }

  return (
    <div className={styles.page}>
      {viewState.error ? (
        <Alert tone="error" title="Não foi possível iniciar a partida">
          {viewState.error}
        </Alert>
      ) : null}

      <MatchSetupForm
        rows={viewState.rows}
        summary={viewState.summary}
        error=""
        blockingMessage={viewState.blockingMessage}
        submitting={viewState.submitting}
        disabled={false}
        onToggle={actions.toggleParticipant}
        onChangeRole={actions.setParticipantRole}
        onSelectAll={actions.selectAll}
        onDeselectAll={actions.deselectAll}
        onSubmit={actions.submit}
      />
    </div>
  )
}

export default MatchSetupPage
