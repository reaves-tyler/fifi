export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  await getScenarioOrThrow(id)
  await scenarioStorage().removeItem(id)
  setResponseStatus(event, 204)
  return null
})
