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

const drawEndAge = computed(
  () => inputs.value.college.draw_start_age + inputs.value.college.draw_years,
)

// Growth phase, the draw window, and a few trailing years of the leftover
const collegeRecords = computed(() =>
  projection.value.records.filter(rec => rec.age <= drawEndAge.value + 5),
)

// Violet for the fund (green/blue belong to the retirement buckets), red
// dashed for the tuition target — adjacent validated slots of the palette.
const palette = computed(() => {
  const dark = colorMode.value === 'dark'
  return {
    violet: dark ? '#9085e9' : '#4a3aa7',
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
  const records = collegeRecords.value
  const p = palette.value
  return {
    labels: records.map(rec => rec.age),
    datasets: [
      {
        label: 'Fund Balance',
        data: records.map(rec => rec.college_balance),
        borderColor: p.violet,
        backgroundColor: withAlpha(p.violet, 0.35),
        borderWidth: 2,
        pointRadius: 0,
        pointHitRadius: 12,
        fill: 'origin',
        tension: 0.25,
      },
      {
        label: 'Annual Tuition',
        data: records.map(rec => rec.college_shortfall - rec.college_flow),
        borderColor: p.red,
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [6, 4],
        pointRadius: 0,
        pointHitRadius: 12,
        fill: false,
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
            const rec = collegeRecords.value[items[0]?.dataIndex ?? 0]
            if (!rec) return []
            const lines: string[] = []
            if (rec.college_flow < 0) lines.push(`Paid from fund: ${formatCurrency(-rec.college_flow)}`)
            if (rec.college_shortfall > 0) lines.push(`Unfunded: ${formatCurrency(rec.college_shortfall)}`)
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
      <div>
        <h2 class="font-semibold text-highlighted">College Fund Trajectory</h2>
        <p class="text-xs text-muted">
          Growth, the tuition window (ages {{ inputs.college.draw_start_age }}–{{ drawEndAge - 1 }}),
          and the leftover that keeps compounding — Roth rollover seed and continued-education money.
        </p>
      </div>
    </template>
    <ClientOnly>
      <div class="h-80">
        <Line :data="chartData" :options="chartOptions" />
      </div>
      <template #fallback>
        <div class="h-80 flex items-center justify-center text-muted text-sm">Loading chart…</div>
      </template>
    </ClientOnly>
  </UCard>
</template>
