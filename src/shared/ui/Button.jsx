import styles from './ui.module.css'

const VARIANT_CLASS = {
  primary: styles.primary,
  secondary: styles.secondary,
  ghost: styles.ghost,
  danger: styles.danger,
}

/**
 * Botão apresentacional acessível.
 * @param {{ children?: React.ReactNode, variant?: 'primary' | 'secondary' | 'ghost' | 'danger', type?: 'button' | 'submit' | 'reset', disabled?: boolean, className?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>} props
 */
export function Button({
  children,
  variant = 'primary',
  type = 'button',
  disabled = false,
  className = '',
  ...rest
}) {
  const classes = [styles.button, VARIANT_CLASS[variant] ?? styles.primary, className]
    .filter(Boolean)
    .join(' ')

  return (
    <button type={type} className={classes} disabled={disabled} {...rest}>
      {children}
    </button>
  )
}

export default Button
