import { useState } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from '@/shared/ui/Button'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { SpecialOverlay } from '@/shared/ui/SpecialOverlay'

describe('acessibilidade dos diálogos', () => {
  it('move o foco para a sobreposição e permite dispensar com Enter', async () => {
    const user = userEvent.setup()
    const onDismiss = vi.fn()

    render(<SpecialOverlay title="Cidade Dorme" onDismiss={onDismiss} />)

    const dialog = screen.getByRole('dialog', { name: 'Cidade Dorme' })
    expect(document.activeElement).toBe(dialog)
    expect(dialog.parentElement).toBe(document.body)
    expect(dialog.dataset.layer).toBe('announcement')

    await user.keyboard('{Enter}')

    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('mantém o controle persistente focável fora da sobreposição', async () => {
    const user = userEvent.setup()
    const onDismiss = vi.fn()
    const onFinish = vi.fn()

    render(
      <div>
        <Button variant="secondary" onClick={onFinish}>
          Encerrar partida
        </Button>
        <SpecialOverlay title="Cidade Dorme" onDismiss={onDismiss} />
      </div>,
    )

    const overlay = screen.getByRole('dialog', { name: 'Cidade Dorme' })
    expect(overlay.getAttribute('aria-modal')).not.toBe('true')

    const finishButton = screen.getByRole('button', {
      name: 'Encerrar partida',
    })
    expect(overlay.contains(finishButton)).toBe(false)
    finishButton.focus()
    expect(document.activeElement).toBe(finishButton)

    await user.keyboard('{Enter}')

    expect(onFinish).toHaveBeenCalledTimes(1)
    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('foca a ação de confirmação e cancela com Escape', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    const onCancel = vi.fn()

    render(
      <ConfirmDialog
        open
        title="Encerrar partida?"
        description="O turno em andamento não será contabilizado."
        confirmLabel="Encerrar"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    )

    const dialog = screen.getByRole('dialog', { name: 'Encerrar partida?' })
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    expect(dialog.closest('[data-layer="confirm"]')).toBeTruthy()
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Encerrar' }),
    )

    await user.keyboard('{Escape}')

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('restaura o foco ao controle anterior quando a confirmação fecha', async () => {
    const user = userEvent.setup()

    function Harness() {
      const [open, setOpen] = useState(false)

      return (
        <div>
          <button type="button" onClick={() => setOpen(true)}>
            Encerrar partida
          </button>
          <ConfirmDialog
            open={open}
            title="Encerrar partida?"
            onCancel={() => setOpen(false)}
            onConfirm={() => setOpen(false)}
          />
        </div>
      )
    }

    render(<Harness />)

    const trigger = screen.getByRole('button', { name: 'Encerrar partida' })
    await user.click(trigger)

    await screen.findByRole('dialog', { name: 'Encerrar partida?' })
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    await waitFor(() => expect(document.activeElement).toBe(trigger))
  })
})
