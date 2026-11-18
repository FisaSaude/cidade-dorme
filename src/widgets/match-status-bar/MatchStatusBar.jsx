import { MatchPhase } from '@/entities/match'
import { PlayerStatus } from '@/entities/match-participant'
import { FinishMatchButton } from '@/features/match-closure/ui/FinishMatchButton'
import { matchPhaseLabels } from '@/shared/config/labels'
import styles from './MatchStatusBar.module.css'

/**
 * Barra persistente com o estado da partida e o ponto único de encerramento.
 * @param {{
 *   session: object,
 *   nextStepLabel?: string,
 *   closure?: {
 *     isConfirmOpen?: boolean,
 *     onOpen?: () => void,
 *     onCancel?: () => void,
 *     onConfirm?: () => void,
 *   },
 * }} props
 */
export function MatchStatusBar({
  session,
  nextStepLabel = '',
  overlayActive = false,
  closure = {},
}) {
  const total = session.match.participants.length
  const alive = session.match.participants.filter(
    (participant) => participant.status === PlayerStatus.ALIVE,
  ).length
  const dead = total - alive
  const isFinished =
    session.phase === MatchPhase.FINISHED || session.match.status === 'FINISHED'

  return (
    <div className={styles.container}>
      {overlayActive ? null : (
        <dl className={styles.bar}>
          <div className={styles.item}>
            <dt>Turno</dt>
            <dd>{session.currentTurn}</dd>
          </div>
          <div className={styles.item}>
            <dt>Fase</dt>
            <dd>{matchPhaseLabels[session.phase] ?? session.phase}</dd>
          </div>
          <div className={styles.item}>
            <dt>Vivos</dt>
            <dd>{alive}</dd>
          </div>
          <div className={styles.item}>
            <dt>Mortos</dt>
            <dd>{dead}</dd>
          </div>
          <div className={styles.item}>
            <dt>Próxima etapa</dt>
            <dd>{nextStepLabel || '—'}</dd>
          </div>
        </dl>
      )}

      <FinishMatchButton
        confirmOpen={Boolean(closure.isConfirmOpen)}
        disabled={isFinished}
        overlayActive={overlayActive}
        onOpen={closure.onOpen}
        onCancel={closure.onCancel}
        onConfirm={closure.onConfirm}
      />
    </div>
  )
}

export default MatchStatusBar
