import styles from './SpecialOverlay.module.css'

/**
 * Sobreposição especial de tela cheia para anúncios da partida.
 * @param {{
 *   title: string,
 *   onDismiss?: () => void,
 *   footerAction?: React.ReactNode,
 * }} props
 */
export function SpecialOverlay({ title, onDismiss, footerAction = null }) {
  function dismiss() {
    onDismiss?.()
  }

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      tabIndex={0}
      onClick={dismiss}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          dismiss()
        }
      }}
    >
      <section className={styles.dialog}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.hint}>Clique ou pressione Enter/Espaço para continuar.</p>
        {footerAction ? (
          <div
            className={styles.footer}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            {footerAction}
          </div>
        ) : null}
      </section>
    </div>
  )
}

export default SpecialOverlay
