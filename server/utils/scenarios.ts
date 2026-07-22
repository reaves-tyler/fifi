import type { Scenario } from '#shared/types'

export function scenarioStorage() {
  return useStorage<Scenario>('scenarios')
}

export async function getScenarioOrThrow(id: string): Promise<Scenario> {
  if (!/^[\w-]+$/.test(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid scenario id' })
  }
  const scenario = await scenarioStorage().getItem(id)
  if (!scenario) {
    throw createError({ statusCode: 404, statusMessage: 'Scenario not found' })
  }
  return scenario
}

export function newScenarioId(): string {
  return crypto.randomUUID().slice(0, 8)
}

export function cleanName(raw: unknown): string {
  const name = typeof raw === 'string' ? raw.trim().slice(0, 80) : ''
  return name || 'Untitled scenario'
}
