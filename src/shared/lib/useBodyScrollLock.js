import { useEffect } from 'react'

const locks = new WeakMap()

function acquire(body) {
  const current = locks.get(body)
  const previousOverflow =
    current?.count > 0 ? current.previousOverflow : body.style.overflow

  locks.set(body, {
    count: (current?.count ?? 0) + 1,
    previousOverflow,
  })
  body.style.overflow = 'hidden'

  return () => {
    const active = locks.get(body)

    if (!active) {
      return
    }

    const remaining = active.count - 1

    if (remaining <= 0) {
      body.style.overflow = active.previousOverflow
      locks.delete(body)
      return
    }

    locks.set(body, {
      count: remaining,
      previousOverflow: active.previousOverflow,
    })
  }
}

/**
 * Bloqueia o scroll do body enquanto `active` for verdadeiro.
 * Múltiplos consumidores compartilham o mesmo bloqueio e o valor anterior
 * de `overflow` é restaurado apenas quando o último é liberado.
 * @param {boolean} [active]
 * @param {Document | null} [doc]
 */
export function useBodyScrollLock(
  active = true,
  doc = typeof document === 'undefined' ? null : document,
) {
  useEffect(() => {
    const body = doc?.body

    if (!active || !body) {
      return undefined
    }

    return acquire(body)
  }, [active, doc])
}

export default useBodyScrollLock
