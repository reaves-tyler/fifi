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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

const { projection, inputs } = useFireModel()
const colorMode = useColorMode()

const retirementRecords = computed(() =>
  projection.value.records.filter(rec => rec.age >= projection.value.retirement_age),
)

const unlockAge = computed(() => inputs.value.simulation.traditional_retire_age)

const palette = computed(() => {
  const dark = colorMode.value === 'dark'
  return {
    green: '#008300',
    blue: dark ? '#3987e5' : '#2a78d6',
    red: dark ? '#e66767' : '#e34948',
    ink: dark ? '#c3c2b7' : '#52514e',
    grid: dark ? '#2c2c2a' : '#e1e0d9',
  }
})

function withAlpha(hex: string, alpha: number) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

const chartData = computed<ChartData<'line'>>(() => {
  const records = retirementRecords.value
  const p = palette.value
  return {
    labels: records.map(rec => rec.age),
    datasets: [
      {
        label: 'Tax-Advantaged',
        data: records.map(rec => Math.max(0, rec.tax_adv_balance)),
        borderColor: p.green,
        backgroundColor: withAlpha(p.green, 0.35),
        borderWidth: 2,
        pointRadius: 0,
        pointHitRadius: 12,
        fill: 'origin',
        stack: 'assets',
        tension: 0.25,
      },
      {
        label: 'Taxable Bridge',
        data: records.map(rec => Math.max(0, rec.bridge_balance)),
        borderColor: p.blue,
        backgroundColor: withAlpha(p.blue, 0.35),
        borderWidth: 2,
        pointRadius: 0,
        pointHitRadius: 12,
        fill: '-1',
        stack: 'assets',
        tension: 0.25,
      },
      {
        label: 'Annual Spending',
        data: records.map(rec => rec.expenses),
        borderColor: p.red,
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [6, 4],
        pointRadius: 0,
        pointHitRadius: 12,
        fill: false,
        stack: 'spending',
        tension: 0.25,
      },
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
          afterBody: (items) => {
            const rec = retirementRecords.value[items[0]?.dataIndex ?? 0]
            if (!rec) return []
            const lines: string[] = []
            if (rec.bridge_flow < 0) lines.push(`Drawn from bridge: ${formatCurrency(-rec.bridge_flow)}`)
            if (rec.tax_adv_flow < 0) lines.push(`Drawn from tax-adv: ${formatCurrency(-rec.tax_adv_flow)}`)
            if (rec.age === unlockAge.value) lines.push('Tax-advantaged accounts unlock this year')
            return lines
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
        stacked: true,
        title: { display: true, text: 'Balance', color: p.ink },
        ticks: { color: p.ink, callback: value => formatCurrencyCompact(Number(value)) },
        grid: { color: p.grid },
        beginAtZero: true,
      },
    },
  }
})
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="font-semibold text-highlighted">Retirement Drawdown</h2>
          <p class="text-xs text-muted">
            From retirement at age {{ projection.retirement_age }}
            <template v-if="projection.fire_age !== null"> (FIRE)</template>
            <template v-else> (traditional — FIRE not reached)</template>.
            The bridge carries spending until tax-advantaged accounts unlock at {{ unlockAge }}.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <UBadge variant="subtle" color="neutral">
            At {{ inputs.simulation.life_expectancy }}: {{ formatCurrencyCompact(projection.final_portfolio) }}
          </UBadge>
          <UBadge v-if="projection.depletion_age !== null" variant="subtle" color="error">
            Runs out at age {{ projection.depletion_age }}
          </UBadge>
          <UBadge v-else variant="subtle" color="success">Never depletes</UBadge>
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
</template>
