<script setup lang="ts">
const { projection, inputs } = useFireModel()

const retirementRecords = computed(() =>
  projection.value.records.filter(rec => rec.age >= projection.value.retirement_age),
)

const unlockAge = computed(() => inputs.value.simulation.traditional_retire_age)
const showSS = computed(() => inputs.value.social_security.enabled)
const showLadder = computed(() => inputs.value.roth_ladder.enabled)

const columns = computed(() => [
  { key: 'age', label: 'Age' },
  { key: 'expenses', label: 'Spending' },
  ...(showSS.value ? [{ key: 'ss', label: 'Soc Sec' }] : []),
  { key: 'from_bridge', label: 'From Bridge' },
  { key: 'from_tax_adv', label: 'From Tax-Adv' },
  ...(showLadder.value
    ? [
        { key: 'conversion', label: 'Roth Conv.' },
        { key: 'ladder', label: 'Ladder Draw' },
      ]
    : []),
  { key: 'bridge_balance', label: 'Bridge' },
  { key: 'tax_adv_balance', label: 'Tax-Advantaged' },
  { key: 'total', label: 'Total Portfolio' },
])
</script>

<template>
  <UCard :ui="{ body: 'p-0 sm:p-0' }">
    <template #header>
      <h2 class="font-semibold text-highlighted">Retirement Year-by-Year</h2>
    </template>
    <div class="overflow-x-auto max-h-[32rem] overflow-y-auto">
      <table class="w-full text-sm tabular-nums">
        <thead class="sticky top-0 z-10 bg-elevated">
          <tr>
            <th
              v-for="col in columns"
              :key="col.key"
              class="px-3 py-2 text-right first:text-left font-medium text-muted whitespace-nowrap"
            >
              {{ col.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="rec in retirementRecords"
            :key="rec.age"
            class="border-t border-default"
            :class="rec.bridge_balance + rec.tax_adv_balance < 0 ? 'bg-error/5' : ''"
          >
            <td class="px-3 py-1.5 font-medium whitespace-nowrap">
              {{ rec.age }}
              <UBadge v-if="rec.age === projection.retirement_age" size="sm" variant="subtle" class="ml-1">
                {{ projection.fire_age !== null ? 'FIRE' : 'Retire' }}
              </UBadge>
              <UBadge v-else-if="rec.age === unlockAge" size="sm" variant="subtle" color="success" class="ml-1">
                Unlock
              </UBadge>
              <UBadge v-else-if="rec.age === projection.depletion_age" size="sm" variant="subtle" color="error" class="ml-1">
                Depleted
              </UBadge>
            </td>
            <td class="px-3 py-1.5 text-right">{{ formatCurrency(rec.expenses) }}</td>
            <td v-if="showSS" class="px-3 py-1.5 text-right text-muted">{{ formatCurrency(rec.ss_income) }}</td>
            <td class="px-3 py-1.5 text-right">{{ formatCurrency(-Math.min(0, rec.bridge_flow)) }}</td>
            <td class="px-3 py-1.5 text-right">{{ formatCurrency(-Math.min(0, rec.tax_adv_flow)) }}</td>
            <td v-if="showLadder" class="px-3 py-1.5 text-right text-muted">{{ formatCurrency(rec.roth_conversion) }}</td>
            <td v-if="showLadder" class="px-3 py-1.5 text-right text-muted">{{ formatCurrency(rec.ladder_withdrawal) }}</td>
            <td class="px-3 py-1.5 text-right" :class="rec.bridge_balance < 0 ? 'text-error' : ''">
              {{ formatCurrency(rec.bridge_balance) }}
            </td>
            <td class="px-3 py-1.5 text-right" :class="rec.tax_adv_balance < 0 ? 'text-error' : ''">
              {{ formatCurrency(rec.tax_adv_balance) }}
            </td>
            <td
              class="px-3 py-1.5 text-right font-medium"
              :class="rec.bridge_balance + rec.tax_adv_balance < 0 ? 'text-error' : ''"
            >
              {{ formatCurrency(rec.bridge_balance + rec.tax_adv_balance) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </UCard>
</template>
