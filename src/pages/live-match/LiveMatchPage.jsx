import { PlayerStatus } from '@/entities/match-participant/model/playerStatus'
import { matchPhaseLabels } from '@/shared/config/labels'
import { EmptyState } from '@/shared/ui/EmptyState'
import styles from './LiveMatchPage.module.css'

/**
 * Visão mínima da partida em andamento. As fases completas são adicionadas
 * pelas histórias de condução do turno.
 * @param {{ session: object | null }} props
 */
export function LiveMatchPage({ session }) {
  if (!session) {
    return (
      <EmptyState
        title="Nenhuma partida em andamento"
        description="Configure uma nova partida para começar."
      />
    )
  }

  const { match, currentTurn, phase } = session
  const aliveCount = match.participants.filter(
    (participant) => participant.status === PlayerStatus.ALIVE,
  ).length

  return (
    <section className={styles.page} aria-labelledby="live-match-status-title">
      <h2 id="live-match-status-title" className={styles.title}>
        Partida em andamento
      </h2>
      <dl className={styles.status}>
        <div className={styles.item}>
          <dt>Turno</dt>
          <dd>{currentTurn}</dd>
        </div>
        <div className={styles.item}>
          <dt>Fase</dt>
          <dd>{matchPhaseLabels[phase] ?? phase}</dd>
        </div>
        <div className={styles.item}>
          <dt>Vivos</dt>
          <dd>
            {aliveCount} de {match.participants.length}
          </dd>
        </div>
      </dl>
    </section>
  )
}

export default LiveMatchPage
