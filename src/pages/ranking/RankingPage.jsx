import { RankingTable } from '@/features/participant-ranking/ui/RankingTable'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { useRankingViewModel } from './useRankingViewModel'
import styles from './RankingPage.module.css'

/**
 * Página de consulta do ranking de participantes por sobrevivências.
 * @param {{
 *   matchRepository: { listFinished: Function },
 *   participantRepository: { list: Function },
 * }} props
 */
export function RankingPage({ matchRepository, participantRepository }) {
  const { viewState, actions } = useRankingViewModel({
    matchRepository,
    participantRepository,
  })

  return (
    <div className={styles.page}>
      {viewState.error ? (
        <Alert tone="error" title="Falha ao carregar o ranking">
          <p className={styles.alertText}>{viewState.error}</p>
          <Button variant="secondary" onClick={actions.retry}>
            Tentar novamente
          </Button>
        </Alert>
      ) : null}

      {viewState.loading ? (
        <LoadingState label="Carregando ranking…" />
      ) : null}

      {!viewState.loading && viewState.empty ? (
        <EmptyState
          title="Nenhum participante cadastrado"
          description="Cadastre participantes para acompanhar as sobrevivências no ranking."
        />
      ) : null}

      {!viewState.loading && !viewState.empty ? (
        <RankingTable items={viewState.items} />
      ) : null}
    </div>
  )
}

export default RankingPage
