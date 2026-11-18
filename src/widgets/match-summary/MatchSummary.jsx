import { MatchOutcomeBadge } from '@/entities/match'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { LoadingState } from '@/shared/ui/LoadingState'
import styles from './MatchSummary.module.css'

const ELIMINATION_PHASE_LABELS = Object.freeze({
  NIGHT: 'Noite',
  VOTE: 'Votação',
})

/**
 * @param {{ turn?: number, phase?: string } | null} eliminatedAt
 * @returns {string}
 */
function describeElimination(eliminatedAt) {
  if (!eliminatedAt) {
    return ''
  }

  const phaseLabel =
    ELIMINATION_PHASE_LABELS[eliminatedAt.phase] ?? eliminatedAt.phase ?? ''

  return `Turno ${eliminatedAt.turn ?? '—'} — ${phaseLabel}`
}

/**
 * Resumo do resultado final da partida e do estado de persistência.
 * @param {{
 *   result: {
 *     winner: string | null,
 *     closureReason: string | null,
 *     turnCount: number,
 *     endedAtLabel?: string,
 *     survivors: Array<{ participantId: string, name: string }>,
 *     eliminated: Array<{ participantId: string, name: string, eliminatedAt?: object | null }>,
 *   },
 *   persistence?: { state?: string, error?: string, savedMatchId?: string | null },
 *   onRetry?: () => void,
 * }} props
 */
export function MatchSummary({
  result,
  persistence = { state: 'idle', error: '', savedMatchId: null },
  onRetry,
}) {
  const survivors = result.survivors ?? []
  const eliminated = result.eliminated ?? []

  return (
    <section className={styles.summary} aria-labelledby="match-summary-title">
      <h3 id="match-summary-title" className={styles.title}>
        Resumo da partida
      </h3>

      <MatchOutcomeBadge
        winner={result.winner}
        closureReason={result.closureReason}
      />

      <dl className={styles.stats}>
        <div className={styles.stat}>
          <dt>Turnos encerrados</dt>
          <dd>{result.turnCount}</dd>
        </div>
        <div className={styles.stat}>
          <dt>Encerrada em</dt>
          <dd>{result.endedAtLabel || '—'}</dd>
        </div>
        <div className={styles.stat}>
          <dt>Sobreviventes</dt>
          <dd>{survivors.length}</dd>
        </div>
        <div className={styles.stat}>
          <dt>Eliminados</dt>
          <dd>{eliminated.length}</dd>
        </div>
      </dl>

      <div className={styles.columns}>
        <section className={styles.column} aria-labelledby="match-survivors-title">
          <h4 id="match-survivors-title" className={styles.columnTitle}>
            Sobreviventes
          </h4>
          {survivors.length > 0 ? (
            <ul className={styles.list}>
              {survivors.map((participant) => (
                <li key={participant.participantId}>{participant.name}</li>
              ))}
            </ul>
          ) : (
            <p className={styles.muted}>Nenhum sobrevivente.</p>
          )}
        </section>

        <section className={styles.column} aria-labelledby="match-eliminated-title">
          <h4 id="match-eliminated-title" className={styles.columnTitle}>
            Eliminados
          </h4>
          {eliminated.length > 0 ? (
            <ul className={styles.list}>
              {eliminated.map((participant) => {
                const elimination = describeElimination(participant.eliminatedAt)

                return (
                  <li key={participant.participantId}>
                    <span>{participant.name}</span>
                    {elimination ? (
                      <span className={styles.muted}> — {elimination}</span>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className={styles.muted}>Nenhum participante eliminado.</p>
          )}
        </section>
      </div>

      <div className={styles.persistence} aria-live="polite">
        {persistence.state === 'saving' ? (
          <LoadingState label="Salvando partida…" />
        ) : null}

        {persistence.state === 'saved' ? (
          <p className={styles.saved}>Partida salva no histórico.</p>
        ) : null}

        {persistence.state === 'error' ? (
          <Alert tone="error" title="Não foi possível salvar a partida.">
            <p className={styles.errorText}>
              {persistence.error || 'Tente novamente em instantes.'}
            </p>
            <Button variant="secondary" onClick={onRetry}>
              Tentar novamente
            </Button>
          </Alert>
        ) : null}
      </div>
    </section>
  )
}

export default MatchSummary
