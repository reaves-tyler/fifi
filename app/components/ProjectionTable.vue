<script setup lang="ts">
const { projection, inputs } = useFireModel()

const accumulationRecords = computed(() =>
  projection.value.records.filter(rec => rec.age <= inputs.value.simulation.traditional_retire_age),
)

const columns = [
  { key: 'age', label: 'Age' },
  { key: 'salary', label: 'Salary' },
  { key: 'spouse_income', label: 'Spouse Net' },
  { key: 'total_net', label: 'Total Net' },
  { key: 'expenses', label: 'Expenses' },
  { key: 'surplus', label: 'Surplus' },
  { key: 'bridge_balance', label: 'Bridge' },
  { key: 'required_bridge', label: 'Required Bridge' },
  { key: 'tax_adv_balance', label: 'Tax-Advantaged' },
] as const
</script>

<template>
  <UCard :ui="{ body: 'p-0 sm:p-0' }">
    <template #header>
      <h2 class="font-semibold text-highlighted">Year-by-Year Projection</h2>
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
            v-for="rec in accumulationRecords"
            :key="rec.age"
            class="border-t border-default"
            :class="rec.is_retired ? 'bg-primary/5' : ''"
          >
            <td class="px-3 py-1.5 font-medium whitespace-nowrap">
              {{ rec.age }}
              <UBadge v-if="rec.is_retired" size="sm" variant="subtle" class="ml-1">FIRE</UBadge>
            </td>
            <td class="px-3 py-1.5 text-right">{{ formatCurrency(rec.salary) }}</td>
            <td class="px-3 py-1.5 text-right">{{ formatCurrency(rec.spouse_income) }}</td>
            <td class="px-3 py-1.5 text-right">{{ formatCurrency(rec.total_net) }}</td>
            <td class="px-3 py-1.5 text-right">{{ formatCurrency(rec.expenses) }}</td>
            <td class="px-3 py-1.5 text-right" :class="rec.surplus < 0 ? 'text-error' : ''">
              {{ formatCurrency(rec.surplus) }}
            </td>
            <td class="px-3 py-1.5 text-right" :class="rec.bridge_balance < 0 ? 'text-error' : ''">
              {{ formatCurrency(rec.bridge_balance) }}
            </td>
            <td class="px-3 py-1.5 text-right text-muted">{{ formatCurrency(rec.required_bridge) }}</td>
            <td class="px-3 py-1.5 text-right">{{ formatCurrency(rec.tax_adv_balance) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </UCard>
</template>
