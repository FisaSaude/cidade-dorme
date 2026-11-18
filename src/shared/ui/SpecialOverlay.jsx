import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useBodyScrollLock } from '@/shared/lib/useBodyScrollLock'
import styles from './SpecialOverlay.module.css'

/**
 * Sobreposição especial de tela cheia para anúncios da partida.
 * Não é modal: o ponto único de encerramento continua acessível por estar
 * em uma camada própria, fora do conteúdo inerte da aplicação.
 * @param {{
 *   title: string,
 *   onDismiss?: () => void,
 * }} props
 */
export function SpecialOverlay({ title, onDismiss }) {
  const overlayRef = useRef(null)
  const previousFocusRef = useRef(null)

  useBodyScrollLock(true)

  useEffect(() => {
    previousFocusRef.current =
      typeof document === 'undefined' ? null : document.activeElement

    const root =
      typeof document === 'undefined' ? null : document.getElementById('root')
    const hadInert = root?.hasAttribute('inert') ?? false
    const previousAriaHidden = root?.getAttribute('aria-hidden') ?? null

    if (root) {
      root.setAttribute('inert', '')
      root.setAttribute('aria-hidden', 'true')
    }

    overlayRef.current?.focus()

    return () => {
      if (root) {
        if (!hadInert) {
          root.removeAttribute('inert')
        }

        if (previousAriaHidden === null) {
          root.removeAttribute('aria-hidden')
        } else {
          root.setAttribute('aria-hidden', previousAriaHidden)
        }
      }

      const target = previousFocusRef.current

      if (
        target &&
        typeof target.focus === 'function' &&
        target.ownerDocument?.contains(target)
      ) {
        target.focus()
      }

      previousFocusRef.current = null
    }
  }, [])

  function dismiss() {
    onDismiss?.()
  }

  const content = (
    <div
      ref={overlayRef}
      className={styles.overlay}
      role="dialog"
      aria-label={title}
      data-layer="announcement"
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
      </section>
    </div>
  )

  if (typeof document === 'undefined') {
    return content
  }

  return createPortal(content, document.body)
}

export default SpecialOverlay
