import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { MatchHistoryDetail } from '@/features/match-history/ui/MatchHistoryDetail'
import { MatchHistoryList } from '@/features/match-history/ui/MatchHistoryList'
import { useHistoryViewModel } from './useHistoryViewModel'
import styles from './HistoryPage.module.css'

/**
 * Página de consulta do histórico de partidas finalizadas.
 * @param {{
 *   matchRepository: { listFinished: Function },
 *   participantRepository: { list: Function },
 * }} props
 */
export function HistoryPage({ matchRepository, participantRepository }) {
  const { viewState, actions } = useHistoryViewModel({
    matchRepository,
    participantRepository,
  })

  return (
    <div className={styles.page}>
      {viewState.error ? (
        <Alert tone="error" title="Falha ao carregar o histórico">
          <p className={styles.alertText}>{viewState.error}</p>
          <Button variant="secondary" onClick={actions.retry}>
            Tentar novamente
          </Button>
        </Alert>
      ) : null}

      {viewState.loading ? (
        <LoadingState label="Carregando histórico…" />
      ) : null}

      {!viewState.loading && viewState.empty ? (
        <EmptyState
          title="Nenhuma partida finalizada"
          description="As partidas encerradas por vitória ou manualmente aparecerão aqui."
        />
      ) : null}

      {viewState.detail ? (
        <MatchHistoryDetail
          detail={viewState.detail}
          onBack={actions.closeDetail}
        />
      ) : null}

      {!viewState.loading &&
      !viewState.empty &&
      !viewState.detail ? (
        <MatchHistoryList
          items={viewState.items}
          onSelect={actions.selectMatch}
        />
      ) : null}
    </div>
  )
}

export default HistoryPage
