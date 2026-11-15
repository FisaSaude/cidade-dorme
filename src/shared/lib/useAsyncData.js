import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Carrega dados assíncronos com estados `loading`, `error`, `data` e `retry`.
 * O carregamento é executado ao montar e a cada tentativa explícita.
 * @template T
 * @param {() => Promise<T>} load
 * @returns {{ data: T | null, error: unknown, loading: boolean, retry: () => void }}
 */
export function useAsyncData(load) {
  const loadRef = useRef(load)
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({
    data: null,
    error: null,
    loading: true,
  })

  useEffect(() => {
    loadRef.current = load
  }, [load])

  useEffect(() => {
    let active = true

    Promise.resolve()
      .then(() => loadRef.current())
      .then((data) => {
        if (active) {
          setState({ data, error: null, loading: false })
        }
      })
      .catch((error) => {
        if (active) {
          setState({ data: null, error, loading: false })
        }
      })

    return () => {
      active = false
    }
  }, [attempt])

  const retry = useCallback(() => {
    setState({ data: null, error: null, loading: true })
    setAttempt((value) => value + 1)
  }, [])

  return { ...state, retry }
}

export default useAsyncData
