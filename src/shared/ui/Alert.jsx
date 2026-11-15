import styles from './ui.module.css'

const TONE_CLASS = {
  info: styles.alertInfo,
  success: styles.alertSuccess,
  warning: styles.alertWarning,
  error: styles.alertError,
}

/**
 * Mensagem de alerta acessível e apresentacional.
 * @param {{ tone?: 'info' | 'success' | 'warning' | 'error', title?: React.ReactNode, children?: React.ReactNode, role?: string, className?: string } & React.HTMLAttributes<HTMLDivElement>} props
 */
export function Alert({
  tone = 'info',
  title,
  children,
  role,
  className = '',
  ...rest
}) {
  const classes = [styles.alert, TONE_CLASS[tone] ?? styles.alertInfo, className]
    .filter(Boolean)
    .join(' ')
  const resolvedRole = role ?? (tone === 'error' ? 'alert' : 'status')

  return (
    <div className={classes} role={resolvedRole} {...rest}>
      {title ? <strong className={styles.alertTitle}>{title}</strong> : null}
      {children ? <div>{children}</div> : null}
    </div>
  )
}

export default Alert
