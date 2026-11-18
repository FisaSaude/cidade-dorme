import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { MatchHistoryDetail } from '@/features/match-history/ui/MatchHistoryDetail'
import { MatchHistoryList } from '@/features/match-history/ui/MatchHistoryList'
import { DeleteMatchDialog } from '@/features/match-deletion/ui/DeleteMatchDialog'
import { useHistoryViewModel } from './useHistoryViewModel'
import styles from './HistoryPage.module.css'

/**
 * Página de consulta do histórico de partidas finalizadas.
 * @param {{
 *   matchRepository: { listFinished: Function, deleteMatch: Function },
 *   participantRepository: { list?: Function, listAll?: Function },
 * }} props
 */
export function HistoryPage({ matchRepository, participantRepository }) {
  const { viewState, actions } = useHistoryViewModel({
    matchRepository,
    participantRepository,
  })

  return (
    <div className={styles.page}>
      {viewState.notice ? (
        <Alert tone="success" title="Histórico atualizado">
          {viewState.notice}
        </Alert>
      ) : null}

      {viewState.deletion.error ? (
        <Alert tone="error" title="Não foi possível excluir a partida">
          {viewState.deletion.error}
        </Alert>
      ) : null}

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
          deleting={viewState.deletion.deletingId === viewState.detail.id}
          onBack={actions.closeDetail}
          onDelete={actions.requestDelete}
        />
      ) : null}

      {!viewState.loading &&
      !viewState.empty &&
      !viewState.detail ? (
        <MatchHistoryList
          items={viewState.items}
          deletingId={viewState.deletion.deletingId}
          onSelect={actions.selectMatch}
          onDelete={actions.requestDelete}
        />
      ) : null}

      <DeleteMatchDialog
        open={viewState.deletion.open}
        matchLabel={
          viewState.deletion.item
            ? `Partida de ${viewState.deletion.item.endedAtLabel || 'data desconhecida'}`
            : ''
        }
        blockedMessage={viewState.deletion.blockedMessage}
        deleting={Boolean(viewState.deletion.deletingId)}
        onCancel={actions.cancelDelete}
        onConfirm={actions.confirmDelete}
      />
    </div>
  )
}

export default HistoryPage
