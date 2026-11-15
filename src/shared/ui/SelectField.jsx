import { useId } from 'react'
import styles from './ui.module.css'

/**
 * Campo de seleção apresentacional com rótulo, dica e mensagem de erro.
 * @param {{ label?: string, value?: string, onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void, options?: Array<{ value: string, label: string, disabled?: boolean }>, error?: string, hint?: string, required?: boolean, disabled?: boolean, id?: string, className?: string, children?: React.ReactNode } & React.SelectHTMLAttributes<HTMLSelectElement>} props
 */
export function SelectField({
  label,
  value,
  onChange,
  options = [],
  error = '',
  hint = '',
  required = false,
  disabled = false,
  id,
  className = '',
  children,
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
      <select
        id={fieldId}
        className={styles.select}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
        {children}
      </select>
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

export default SelectField
