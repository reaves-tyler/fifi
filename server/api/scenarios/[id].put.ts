import { normalizeScenarioInputs } from '#shared/utils/defaults'
import type { Scenario } from '#shared/types'

export default defineEventHandler(async (event): Promise<Scenario> => {
  const id = getRouterParam(event, 'id')!
  const existing = await getScenarioOrThrow(id)
  const body = await readBody(event)
  const updated: Scenario = {
    ...existing,
    name: body?.name !== undefined ? cleanName(body.name) : existing.name,
    inputs: body?.inputs !== undefined ? normalizeScenarioInputs(body.inputs) : existing.inputs,
    updatedAt: new Date().toISOString(),
  }
  await scenarioStorage().setItem(id, updated)
  return updated
})
