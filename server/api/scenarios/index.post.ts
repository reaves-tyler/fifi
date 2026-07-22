import { normalizeScenarioInputs } from '#shared/utils/defaults'
import type { Scenario } from '#shared/types'

export default defineEventHandler(async (event): Promise<Scenario> => {
  const body = await readBody(event)
  const now = new Date().toISOString()
  const scenario: Scenario = {
    id: newScenarioId(),
    name: cleanName(body?.name),
    createdAt: now,
    updatedAt: now,
    inputs: normalizeScenarioInputs(body?.inputs),
  }
  await scenarioStorage().setItem(scenario.id, scenario)
  setResponseStatus(event, 201)
  return scenario
})
