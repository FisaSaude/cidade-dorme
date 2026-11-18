import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

const SRC_DIR = join(process.cwd(), 'src')
const MATCH_ENGINE_PATH = join(
  SRC_DIR,
  'entities',
  'match',
  'model',
  'matchEngine.js',
)

const IMPORT_PATTERN = /from\s+['"]([^'"]+)['"]/g
const SOURCE_EXTENSIONS = ['.js', '.jsx']

/**
 * @param {string} directory
 * @returns {string[]}
 */
function listSourceFiles(directory) {
  const entries = readdirSync(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = join(directory, entry.name)

    if (entry.isDirectory()) {
      files.push(...listSourceFiles(fullPath))
    } else if (SOURCE_EXTENSIONS.some((extension) => entry.name.endsWith(extension))) {
      files.push(fullPath)
    }
  }

  return files
}

/**
 * @param {string} filePath
 * @returns {string[]}
 */
function readImports(filePath) {
  return Array.from(readFileSync(filePath, 'utf8').matchAll(IMPORT_PATTERN)).map(
    (match) => match[1],
  )
}

describe('limites arquiteturais (FSD)', () => {
  it('mantém o motor da partida puro, sem React, fetch ou repositórios', () => {
    const source = readFileSync(MATCH_ENGINE_PATH, 'utf8')
    const imports = readImports(MATCH_ENGINE_PATH)

    expect(source).not.toMatch(/from\s+['"]react['"]/)
    expect(source).not.toMatch(/\bfetch\s*\(/)
    expect(source).not.toMatch(/repository/i)
    expect(imports.every((specifier) => !/api|repository/i.test(specifier))).toBe(
      true,
    )
  })

  it('impede que src/shared importe camadas internas', () => {
    const violations = []

    for (const filePath of listSourceFiles(join(SRC_DIR, 'shared'))) {
      for (const specifier of readImports(filePath)) {
        if (/^@\/(entities|features|pages|widgets|app)\//.test(specifier)) {
          violations.push(`${relative(SRC_DIR, filePath)} -> ${specifier}`)
        }
      }
    }

    expect(violations).toEqual([])
  })

  it('impede que uma feature importe outra feature', () => {
    const violations = []

    for (const filePath of listSourceFiles(join(SRC_DIR, 'features'))) {
      for (const specifier of readImports(filePath)) {
        if (specifier.startsWith('@/features/')) {
          violations.push(`${relative(SRC_DIR, filePath)} -> ${specifier}`)
        }
      }
    }

    expect(violations).toEqual([])
  })

  it('mantém os slices de exclusão isolados de outras features', () => {
    const slices = ['participant-deletion', 'match-deletion']
    const violations = []

    for (const slice of slices) {
      for (const filePath of listSourceFiles(join(SRC_DIR, 'features', slice))) {
        for (const specifier of readImports(filePath)) {
          if (specifier.startsWith('@/features/')) {
            violations.push(`${relative(SRC_DIR, filePath)} -> ${specifier}`)
          }
        }
      }
    }

    expect(violations).toEqual([])
  })

  it('usa apenas as APIs públicas dos slices de entities fora de entities', () => {
    const violations = []
    const layers = ['features', 'pages', 'widgets', 'app']

    for (const layer of layers) {
      for (const filePath of listSourceFiles(join(SRC_DIR, layer))) {
        for (const specifier of readImports(filePath)) {
          if (/^@\/entities\/[^/]+\/.+/.test(specifier)) {
            violations.push(`${relative(SRC_DIR, filePath)} -> ${specifier}`)
          }
        }
      }
    }

    expect(violations).toEqual([])
  })
})
