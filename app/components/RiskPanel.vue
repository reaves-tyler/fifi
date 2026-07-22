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
import { runMonteCarlo } from '#shared/utils/montecarlo'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

const { inputs, realDollars } = useFireModel()
const colorMode = useColorMode()

const trials = ref(500)
const trialOptions = [250, 500, 1000, 2000]

const volatilityPct = computed({
  get: () => Math.round(inputs.value.simulation.return_volatility * 1000) / 10,
  set: (v: number) => (inputs.value.simulation.return_volatility = v / 100),
})

const mc = computed(() => runMonteCarlo(inputs.value, { trials: trials.value, seed: 42 }))

// Deflate the nominal bands when the today's-dollars toggle is on
const deflatorAt = (age: number) =>
  realDollars.value
    ? Math.pow(1 + inputs.value.simulation.inflation_rate, age - inputs.value.user.current_age)
    : 1

const bands = computed(() =>
  mc.value.bands.map(b => ({
    age: b.age,
    p10: b.p10 / deflatorAt(b.age),
    p25: b.p25 / deflatorAt(b.age),
    p50: b.p50 / deflatorAt(b.age),
    p75: b.p75 / deflatorAt(b.age),
    p90: b.p90 / deflatorAt(b.age),
  })),
)

const finalDeflator = computed(() => deflatorAt(mc.value.bands.at(-1)?.age ?? inputs.value.user.current_age))

const stats = computed(() => {
  const m = mc.value
  const fmtAge = (a: number | null) => (a === null ? '—' : String(a))
  return [
    {
      label: 'Plan Success Rate',
      value: formatPercent(m.success_rate, 1),
      hint: `Portfolio survives to ${inputs.value.simulation.life_expectancy} in ${Math.round(m.success_rate * m.trials)} of ${m.trials} histories`,
    },
    {
      label: 'FIRE Age (p10 / median / p90)',
      value: `${fmtAge(m.fire_age.p10)} / ${fmtAge(m.fire_age.p50)} / ${fmtAge(m.fire_age.p90)}`,
      hint:
        m.never_fire_rate > 0
          ? `${formatPercent(m.never_fire_rate, 1)} of histories never reach FIRE before 60`
          : 'FIRE is reached before 60 in every history',
    },
    {
      label: 'Final Portfolio (p10 / median / p90)',
      value: `${formatCurrencyCompact(m.final_portfolio.p10 / finalDeflator.value)} / ${formatCurrencyCompact(m.final_portfolio.p50 / finalDeflator.value)} / ${formatCurrencyCompact(m.final_portfolio.p90 / finalDeflator.value)}`,
      hint: realDollars.value ? "In today's dollars" : 'Nominal dollars at life expectancy',
    },
  ]
})

// Single-hue sequential blue (uncertainty = magnitude of one quantity)
const palette = computed(() => {
  const dark = colorMode.value === 'dark'
  return {
    median: dark ? '#3987e5' : '#2a78d6',
    band: dark ? '#3987e5' : '#2a78d6',
    ink: dark ? '#c3c2b7' : '#52514e',
    grid: dark ? '#2c2c2a' : '#e1e0d9',
  }
})

function withAlpha(hex: string, alpha: number) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

const chartData = computed<ChartData<'line'>>(() => {
  const p = palette.value
  const b = bands.value
  const common = { pointRadius: 0, pointHitRadius: 10, tension: 0.25 }
  return {
    labels: b.map(x => x.age),
    datasets: [
      { label: 'p90', data: b.map(x => x.p90), borderColor: 'transparent', backgroundColor: 'transparent', fill: false, ...common },
      { label: '10–90% band', data: b.map(x => x.p10), borderColor: 'transparent', backgroundColor: withAlpha(p.band, 0.15), fill: '-1', ...common },
      { label: 'p75', data: b.map(x => x.p75), borderColor: 'transparent', backgroundColor: 'transparent', fill: false, ...common },
      { label: '25–75% band', data: b.map(x => x.p25), borderColor: 'transparent', backgroundColor: withAlpha(p.band, 0.3), fill: '-1', ...common },
      { label: 'Median', data: b.map(x => x.p50), borderColor: p.median, backgroundColor: 'transparent', borderWidth: 2, fill: false, ...common },
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
        labels: {
          color: p.ink,
          boxWidth: 12,
          boxHeight: 12,
          usePointStyle: true,
          filter: item => item.text === 'Median' || item.text.includes('band'),
        },
      },
      tooltip: {
        callbacks: {
          title: items => `Age ${items[0]?.label}`,
          label: (item) => {
            if (item.dataset.label === 'p90' || item.dataset.label === 'p75') return ''
            const b = bands.value[item.dataIndex]!
            if (item.dataset.label === 'Median') return `Median: ${formatCurrency(b.p50)}`
            if (item.dataset.label === '10–90% band') return `10–90%: ${formatCurrency(b.p10)} – ${formatCurrency(b.p90)}`
            return `25–75%: ${formatCurrency(b.p25)} – ${formatCurrency(b.p75)}`
          },
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
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <UCard v-for="stat in stats" :key="stat.label">
        <div class="text-sm text-muted">{{ stat.label }}</div>
        <div class="mt-1 text-2xl font-semibold text-highlighted">{{ stat.value }}</div>
        <div class="mt-1 text-xs text-dimmed">{{ stat.hint }}</div>
      </UCard>
    </div>

    <UCard>
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 class="font-semibold text-highlighted">Sequence-of-Returns Risk</h2>
            <p class="text-xs text-muted">
              {{ mc.trials }} randomized market histories (lognormal returns, mean
              {{ (inputs.simulation.investment_return * 100).toFixed(1) }}%, volatility
              {{ volatilityPct.toFixed(1) }}%). Each history re-decides its own FIRE age.
            </p>
          </div>
          <div class="flex items-center gap-4">
            <UFormField :label="`Volatility — ${volatilityPct.toFixed(1)}%`" class="w-48">
              <USlider v-model="volatilityPct" :min="5" :max="30" :step="0.5" />
            </UFormField>
            <UFormField label="Trials">
              <USelect v-model="trials" :items="trialOptions" class="w-24" />
            </UFormField>
          </div>
        </div>
      </template>
      <ClientOnly>
        <div class="h-96">
          <Line :data="chartData" :options="chartOptions" />
        </div>
        <template #fallback>
          <div class="h-96 flex items-center justify-center text-muted text-sm">Loading chart…</div>
        </template>
      </ClientOnly>
    </UCard>
  </div>
</template>
