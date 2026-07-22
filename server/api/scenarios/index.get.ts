import type { ScenarioSummary } from '#shared/types'

export default defineEventHandler(async (): Promise<ScenarioSummary[]> => {
  const storage = scenarioStorage()
  const keys = await storage.getKeys()
  const scenarios = await Promise.all(keys.map(key => storage.getItem(key)))
  return scenarios
    .filter(s => s !== null)
    .map(({ id, name, updatedAt }) => ({ id, name, updatedAt }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
})
