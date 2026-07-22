<script setup lang="ts">
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'
import type { ChartData, ChartOptions } from 'chart.js'
import { normalizeScenarioInputs } from '#shared/utils/defaults'
import { deflateProjection, runProjection } from '#shared/utils/projection'
import type { ProjectionResult, ScenarioInputs } from '#shared/types'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

const { inputs, projection, scenarios, scenarioName, realDollars, fetchScenario } = useFireModel()
const colorMode = useColorMode()
const toast = useToast()

const otherId = ref<string | undefined>(undefined)
const other = ref<{ name: string, inputs: ScenarioInputs, projection: ProjectionResult } | null>(null)

const scenarioItems = computed(() => scenarios.value.map(s => ({ label: s.name, value: s.id })))

watch([otherId, realDollars], async ([id]) => {
  if (!id) {
    other.value = null
    return
  }
  try {
    const scenario = await fetchScenario(id)
    const normalized = normalizeScenarioInputs(scenario.inputs)
    let proj = runProjection(normalized)
    if (realDollars.value) proj = deflateProjection(proj, normalized)
    other.value = { name: scenario.name, inputs: normalized, projection: proj }
  } catch {
    toast.add({ title: 'Failed to load comparison scenario', color: 'error' })
    other.value = null
  }
})

function fmtAge(age: number | null): string {
  return age === null ? '—' : String(age)
}

const rows = computed(() => {
  if (!other.value) return []
  const a = projection.value
  const b = other.value.projection
  const money = (v: number) => formatCurrencyCompact(v)
  return [
    {
      metric: 'FIRE Age',
      a: fmtAge(a.fire_age),
      b: fmtAge(b.fire_age),
      delta:
        a.fire_age !== null && b.fire_age !== null
          ? `${a.fire_age - b.fire_age > 0 ? '+' : ''}${a.fire_age - b.fire_age} yrs`
          : '—',
    },
    {
      metric: `Age ${inputs.value.simulation.traditional_retire_age} Tax-Advantaged`,
      a: money(a.age_60_tax_adv),
      b: money(b.age_60_tax_adv),
      delta: money(a.age_60_tax_adv - b.age_60_tax_adv),
    },
    {
      metric: `Final Portfolio (${inputs.value.simulation.life_expectancy})`,
      a: money(a.final_portfolio),
      b: money(b.final_portfolio),
      delta: money(a.final_portfolio - b.final_portfolio),
    },
    {
      metric: 'Depletion Age',
      a: fmtAge(a.depletion_age) === '—' ? 'Never' : fmtAge(a.depletion_age),
      b: fmtAge(b.depletion_age) === '—' ? 'Never' : fmtAge(b.depletion_age),
      delta: '',
    },
  ]
})

// Blue = current working scenario, orange = comparison (validated pair)
const palette = computed(() => {
  const dark = colorMode.value === 'dark'
  return {
    current: dark ? '#3987e5' : '#2a78d6',
    other: dark ? '#d95926' : '#eb6834',
    ink: dark ? '#c3c2b7' : '#52514e',
    grid: dark ? '#2c2c2a' : '#e1e0d9',
  }
})

const chartData = computed<ChartData<'line'>>(() => {
  const p = palette.value
  const a = projection.value.records
  const b = other.value?.projection.records ?? []
  const common = { pointRadius: 0, pointHitRadius: 10, tension: 0.25, fill: false, borderWidth: 2 }
  return {
    labels: a.map(rec => rec.age),
    datasets: [
      {
        label: scenarioName.value || 'Current',
        data: a.map(rec => rec.bridge_balance + rec.tax_adv_balance),
        borderColor: p.current,
        backgroundColor: 'transparent',
        ...common,
      },
      ...(other.value
        ? [
            {
              label: other.value.name,
              data: b.map(rec => rec.bridge_balance + rec.tax_adv_balance),
              borderColor: p.other,
              backgroundColor: 'transparent',
              borderDash: [8, 4],
              ...common,
            },
          ]
        : []),
    ],
  }
})

const chartOptions = computed<ChartOptions<'line'>>(() => {
  const p = palette.value
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: { color: p.ink, boxWidth: 12, boxHeight: 12, usePointStyle: true },
      },
      tooltip: {
        callbacks: {
          title: items => `Age ${items[0]?.label}`,
          label: item => `${item.dataset.label}: ${formatCurrency(item.parsed.y ?? 0)}`,
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'Age', color: p.ink },
        ticks: { color: p.ink },
        grid: { display: false },
      },
      y: {
        title: { display: true, text: 'Total Portfolio', color: p.ink },
        ticks: { color: p.ink, callback: value => formatCurrencyCompact(Number(value)) },
        grid: { color: p.grid },
        beginAtZero: true,
      },
    },
  }
})
</script>

<template>
  <div class="space-y-6">
    <UCard>
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 class="font-semibold text-highlighted">Scenario Comparison</h2>
            <p class="text-xs text-muted">
              Your current working inputs (including unsaved edits) against a saved scenario.
            </p>
          </div>
          <USelectMenu
            v-model="otherId"
            :items="scenarioItems"
            value-key="value"
            placeholder="Compare against…"
            class="w-56"
          />
        </div>
      </template>

      <div v-if="!other" class="py-12 text-center text-sm text-muted">
        Pick a saved scenario to compare against.
      </div>
      <template v-else>
        <div class="overflow-x-auto">
          <table class="w-full text-sm tabular-nums">
            <thead>
              <tr class="text-muted">
                <th class="px-3 py-2 text-left font-medium">Metric</th>
                <th class="px-3 py-2 text-right font-medium">{{ scenarioName || 'Current' }}</th>
                <th class="px-3 py-2 text-right font-medium">{{ other.name }}</th>
                <th class="px-3 py-2 text-right font-medium">Δ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in rows" :key="row.metric" class="border-t border-default">
                <td class="px-3 py-1.5 font-medium">{{ row.metric }}</td>
                <td class="px-3 py-1.5 text-right">{{ row.a }}</td>
                <td class="px-3 py-1.5 text-right">{{ row.b }}</td>
                <td class="px-3 py-1.5 text-right text-muted">{{ row.delta }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <ClientOnly>
          <div class="h-80 mt-6">
            <Line :data="chartData" :options="chartOptions" />
          </div>
          <template #fallback>
            <div class="h-80 flex items-center justify-center text-muted text-sm">Loading chart…</div>
          </template>
        </ClientOnly>
      </template>
    </UCard>
  </div>
</template>
