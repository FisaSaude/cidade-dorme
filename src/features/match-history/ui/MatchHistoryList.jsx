import styles from './MatchHistory.module.css'

/**
 * @param {number} turnCount
 * @returns {string}
 */
function formatTurns(turnCount) {
  return `${turnCount} ${turnCount === 1 ? 'turno' : 'turnos'}`
}

/**
 * @param {number} survivorCount
 * @returns {string}
 */
function formatSurvivors(survivorCount) {
  return `${survivorCount} ${
    survivorCount === 1 ? 'sobrevivente' : 'sobreviventes'
  }`
}

/**
 * Lista de partidas finalizadas.
 * @param {{ items?: Array<object>, onSelect: (matchId: string) => void }} props
 */
export function MatchHistoryList({ items = [], onSelect }) {
  return (
    <section className={styles.listSection} aria-labelledby="history-list-title">
      <div className={styles.sectionHeader}>
        <h3 id="history-list-title" className={styles.sectionTitle}>
          Partidas finalizadas
        </h3>
        <span className={styles.count} aria-label="Quantidade de partidas">
          {items.length}
        </span>
      </div>

      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className={styles.item}
              aria-label={`Ver detalhes da partida de ${
                item.endedAtLabel || 'data desconhecida'
              }`}
              onClick={() => onSelect(item.id)}
            >
              <span className={styles.itemOutcome}>{item.outcomeLabel}</span>
              <span className={styles.itemDate}>
                {item.endedAtLabel || 'Data não informada'}
              </span>
              <span className={styles.itemMeta}>
                {formatTurns(item.turnCount)} •{' '}
                {formatSurvivors(item.survivorCount)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default MatchHistoryList
