import { useId } from 'react'
import styles from './ui.module.css'

/**
 * Campo de texto apresentacional com rótulo, dica e mensagem de erro.
 * @param {{ label?: string, value?: string, onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void, error?: string, hint?: string, required?: boolean, disabled?: boolean, id?: string, type?: string, className?: string } & React.InputHTMLAttributes<HTMLInputElement>} props
 */
export function TextField({
  label,
  value,
  onChange,
  error = '',
  hint = '',
  required = false,
  disabled = false,
  id,
  type = 'text',
  className = '',
  ...rest
}) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const errorId = `${fieldId}-error`
  const hintId = `${fieldId}-hint`
  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined

  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      {label ? (
        <label className={styles.label} htmlFor={fieldId}>
          {label}
          {required ? (
            <span className={styles.requiredMark} aria-hidden="true">
              {' '}
              *
            </span>
          ) : null}
        </label>
      ) : null}
      <input
        id={fieldId}
        type={type}
        className={styles.input}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      />
      {hint ? (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export default TextField
