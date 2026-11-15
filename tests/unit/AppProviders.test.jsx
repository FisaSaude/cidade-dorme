import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AppProviders } from '@/app/providers/AppProviders'
import { useAppServices } from '@/app/providers/appServices'

function ServicesProbe() {
  const { idFactory, now } = useAppServices()

  return (
    <div>
      <span data-testid="id">{idFactory()}</span>
      <span data-testid="now">{now()}</span>
    </div>
  )
}

describe('AppProviders', () => {
  it('expõe os serviços padrão', () => {
    render(
      <AppProviders>
        <ServicesProbe />
      </AppProviders>,
    )

    expect(screen.getByTestId('id').textContent).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    )
    expect(screen.getByTestId('now').textContent).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
    )
  })

  it('permite injetar sobrescritas para testes', () => {
    render(
      <AppProviders
        services={{
          idFactory: () => 'fixed-id',
          now: () => '2026-01-01T00:00:00.000Z',
        }}
      >
        <ServicesProbe />
      </AppProviders>,
    )

    expect(screen.getByTestId('id').textContent).toBe('fixed-id')
    expect(screen.getByTestId('now').textContent).toBe('2026-01-01T00:00:00.000Z')
  })
})
