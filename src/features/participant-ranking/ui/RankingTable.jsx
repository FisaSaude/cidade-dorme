import styles from './RankingTable.module.css'

/**
 * Tabela apresentacional do ranking de sobrevivências.
 * @param {{ items?: Array<{ participantId: string, name: string, survivalCount: number }> }} props
 */
export function RankingTable({ items = [] }) {
  return (
    <section className={styles.section} aria-labelledby="ranking-title">
      <div>
        <h3 id="ranking-title" className={styles.sectionTitle}>
          Ranking de sobrevivências
        </h3>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <caption className={styles.caption}>
            Participantes ordenados por sobrevivências em partidas finalizadas
          </caption>
          <thead>
            <tr>
              <th scope="col">Posição</th>
              <th scope="col">Participante</th>
              <th scope="col">Sobrevivências</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.participantId}>
                <td className={styles.position}>{index + 1}º</td>
                <td className={styles.name}>{item.name}</td>
                <td className={styles.survivalCount}>
                  <span
                    aria-label={`${item.survivalCount} ${
                      item.survivalCount === 1
                        ? 'sobrevivência'
                        : 'sobrevivências'
                    }`}
                  >
                    {item.survivalCount}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default RankingTable
