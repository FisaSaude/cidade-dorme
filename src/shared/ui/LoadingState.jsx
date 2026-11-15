import styles from './ui.module.css'

/**
 * Indicador de carregamento acessível.
 * @param {{ label?: string, className?: string }} props
 */
export function LoadingState({ label = 'Carregando…', className = '' }) {
  return (
    <div
      className={[styles.loading, className].filter(Boolean).join(' ')}
      role="status"
      aria-live="polite"
    >
      <span className={styles.spinner} aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

export default LoadingState
