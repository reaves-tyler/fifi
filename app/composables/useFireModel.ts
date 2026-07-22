import { defaultScenarioInputs, normalizeScenarioInputs } from '#shared/utils/defaults'
import { deflateProjection, runProjection } from '#shared/utils/projection'
import type { Scenario, ScenarioInputs, ScenarioSummary } from '#shared/types'

// localStorage adapter for static builds (no server, no API routes)
const LS_KEY = 'fifi-scenarios'

function readLocalScenarios(): Record<string, Scenario> {
  if (!import.meta.client) return {}
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function writeLocalScenarios(all: Record<string, Scenario>) {
  localStorage.setItem(LS_KEY, JSON.stringify(all))
}

/**
 * App-wide FIRE model. `useState` keeps the inputs shared across all
 * components (SSR-safe), and the projection recomputes reactively whenever
 * any knob changes.
 *
 * Scenario persistence has two backends: the Nitro API (default) and
 * localStorage (static builds, where no server exists).
 */
export function useFireModel() {
  const staticBuild = Boolean(useRuntimeConfig().public.staticBuild)

  const inputs = useState<ScenarioInputs>('fire-inputs', () => defaultScenarioInputs())
  const scenarioId = useState<string | null>('fire-scenario-id', () => null)
  const scenarioName = useState<string>('fire-scenario-name', () => 'Baseline')
  const scenarios = useState<ScenarioSummary[]>('fire-scenarios', () => [])
  /** Display preference: show all dollars in today's purchasing power */
  const realDollars = useState<boolean>('fire-real-dollars', () => false)

  const nominalProjection = computed(() => runProjection(inputs.value))
  const projection = computed(() =>
    realDollars.value
      ? deflateProjection(nominalProjection.value, inputs.value)
      : nominalProjection.value,
  )

  const totalInvested = computed(() => projection.value.total_invested_today)
  const fireAge = computed(() => projection.value.fire_age)
  const age60TaxAdv = computed(() => projection.value.age_60_tax_adv)
  const yearsToFire = computed(() =>
    fireAge.value === null ? null : fireAge.value - inputs.value.user.current_age,
  )

  async function fetchScenario(id: string): Promise<Scenario> {
    if (staticBuild) {
      const scenario = readLocalScenarios()[id]
      if (!scenario) throw new Error(`Scenario ${id} not found`)
      return scenario
    }
    return await $fetch<Scenario>(`/api/scenarios/${id}`)
  }

  async function refreshScenarios() {
    if (staticBuild) {
      if (!import.meta.client) return
      let all = readLocalScenarios()
      if (Object.keys(all).length === 0) {
        const now = new Date().toISOString()
        all = {
          baseline: {
            id: 'baseline',
            name: 'Baseline',
            createdAt: now,
            updatedAt: now,
            inputs: defaultScenarioInputs(),
          },
        }
        writeLocalScenarios(all)
      }
      scenarios.value = Object.values(all)
        .map(({ id, name, updatedAt }) => ({ id, name, updatedAt }))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      return
    }
    scenarios.value = await $fetch<ScenarioSummary[]>('/api/scenarios')
  }

  function applyScenario(scenario: Scenario) {
    inputs.value = normalizeScenarioInputs(scenario.inputs)
    scenarioId.value = scenario.id
    scenarioName.value = scenario.name
  }

  async function loadScenario(id: string) {
    applyScenario(await fetchScenario(id))
  }

  async function saveScenario() {
    if (!scenarioId.value) return saveScenarioAs(scenarioName.value)
    if (staticBuild) {
      const all = readLocalScenarios()
      const existing = all[scenarioId.value]
      const saved: Scenario = {
        id: scenarioId.value,
        name: scenarioName.value,
        createdAt: existing?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        inputs: normalizeScenarioInputs(inputs.value),
      }
      all[saved.id] = saved
      writeLocalScenarios(all)
      applyScenario(saved)
      await refreshScenarios()
      return
    }
    const saved = await $fetch<Scenario>(`/api/scenarios/${scenarioId.value}`, {
      method: 'PUT',
      body: { name: scenarioName.value, inputs: inputs.value },
    })
    applyScenario(saved)
    await refreshScenarios()
  }

  async function saveScenarioAs(name: string) {
    if (staticBuild) {
      const now = new Date().toISOString()
      const saved: Scenario = {
        id: crypto.randomUUID().slice(0, 8),
        name: name.trim() || 'Untitled scenario',
        createdAt: now,
        updatedAt: now,
        inputs: normalizeScenarioInputs(inputs.value),
      }
      const all = readLocalScenarios()
      all[saved.id] = saved
      writeLocalScenarios(all)
      applyScenario(saved)
      await refreshScenarios()
      return
    }
    const saved = await $fetch<Scenario>('/api/scenarios', {
      method: 'POST',
      body: { name, inputs: inputs.value },
    })
    applyScenario(saved)
    await refreshScenarios()
  }

  async function deleteScenario() {
    if (!scenarioId.value) return
    if (staticBuild) {
      const all = readLocalScenarios()
      delete all[scenarioId.value]
      writeLocalScenarios(all)
    } else {
      await $fetch(`/api/scenarios/${scenarioId.value}`, { method: 'DELETE' })
    }
    scenarioId.value = null
    scenarioName.value = 'Untitled scenario'
    await refreshScenarios()
  }

  function newScenario() {
    inputs.value = defaultScenarioInputs()
    scenarioId.value = null
    scenarioName.value = 'Untitled scenario'
  }

  /** Serializable snapshot of the current working scenario. */
  function exportScenario() {
    return {
      fifi_export: 1,
      name: scenarioName.value,
      exported_at: new Date().toISOString(),
      inputs: inputs.value,
    }
  }

  /**
   * Load a previously exported JSON (or any object with an `inputs` shape).
   * Applied as unsaved working state — nothing persists until Save.
   */
  function importScenario(raw: unknown) {
    const r = (raw ?? {}) as Record<string, any>
    inputs.value = normalizeScenarioInputs(r.inputs ?? r)
    scenarioName.value = typeof r.name === 'string' && r.name.trim() ? r.name.trim() : 'Imported scenario'
    scenarioId.value = null
  }

  return {
    staticBuild,
    inputs,
    scenarioId,
    scenarioName,
    scenarios,
    realDollars,
    projection,
    totalInvested,
    fireAge,
    yearsToFire,
    age60TaxAdv,
    fetchScenario,
    refreshScenarios,
    applyScenario,
    loadScenario,
    saveScenario,
    saveScenarioAs,
    deleteScenario,
    newScenario,
    exportScenario,
    importScenario,
  }
}
