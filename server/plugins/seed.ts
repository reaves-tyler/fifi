import { defaultScenarioInputs } from '#shared/utils/defaults'
import type { Scenario } from '#shared/types'

// Seed a baseline scenario on first boot so the app never starts empty.
export default defineNitroPlugin(async () => {
  const storage = useStorage<Scenario>('scenarios')
  const keys = await storage.getKeys()
  if (keys.length > 0) return

  const now = new Date().toISOString()
  const baseline: Scenario = {
    id: 'baseline',
    name: 'Baseline',
    createdAt: now,
    updatedAt: now,
    inputs: defaultScenarioInputs(),
  }
  await storage.setItem(baseline.id, baseline)
})
