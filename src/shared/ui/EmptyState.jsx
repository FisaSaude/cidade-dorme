import styles from './ui.module.css'

/**
 * Estado vazio apresentacional, com ação opcional.
 * @param {{ title: React.ReactNode, description?: React.ReactNode, action?: React.ReactNode, className?: string }} props
 */
export function EmptyState({ title, description, action, className = '' }) {
  return (
    <div className={[styles.empty, className].filter(Boolean).join(' ')}>
      <h2 className={styles.emptyTitle}>{title}</h2>
      {description ? <p>{description}</p> : null}
      {action ? <div className={styles.emptyAction}>{action}</div> : null}
    </div>
  )
}

export default EmptyState
