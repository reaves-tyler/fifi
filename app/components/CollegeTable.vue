<script setup lang="ts">
const { projection, inputs } = useFireModel()

const drawEndAge = computed(
  () => inputs.value.college.draw_start_age + inputs.value.college.draw_years,
)

// Growth phase through the last draw year (plus one trailing year for the leftover)
const collegeRecords = computed(() =>
  projection.value.records.filter(rec => rec.age <= drawEndAge.value),
)

const totalDrawn = computed(() =>
  projection.value.records.reduce((sum, rec) => sum - rec.college_flow, 0),
)
const totalShortfall = computed(() =>
  projection.value.records.reduce((sum, rec) => sum + rec.college_shortfall, 0),
)
const leftover = computed(() => {
  const last = projection.value.records.find(rec => rec.age === drawEndAge.value)
  return last?.college_balance ?? 0
})
</script>

<template>
  <UCard :ui="{ body: 'p-0 sm:p-0' }">
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="font-semibold text-highlighted">College Fund</h2>
          <p class="text-xs text-muted">
            Earmarked money — grows at the market return, pays tuition from age
            {{ inputs.college.draw_start_age }} for {{ inputs.college.draw_years }} years,
            and never touches the retirement math.
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <UBadge variant="subtle" color="neutral">Drawn: {{ formatCurrencyCompact(totalDrawn) }}</UBadge>
          <UBadge v-if="totalShortfall > 0" variant="subtle" color="error">
            Shortfall: {{ formatCurrencyCompact(totalShortfall) }}
          </UBadge>
          <UBadge v-else variant="subtle" color="success">Fully funded</UBadge>
          <UBadge variant="subtle" color="neutral">Leftover: {{ formatCurrencyCompact(leftover) }}</UBadge>
        </div>
      </div>
    </template>
    <div class="overflow-x-auto max-h-[32rem] overflow-y-auto">
      <table class="w-full text-sm tabular-nums">
        <thead class="sticky top-0 z-10 bg-elevated">
          <tr>
            <th class="px-3 py-2 text-left font-medium text-muted">Age</th>
            <th class="px-3 py-2 text-right font-medium text-muted whitespace-nowrap">Tuition Target</th>
            <th class="px-3 py-2 text-right font-medium text-muted whitespace-nowrap">Paid from Fund</th>
            <th class="px-3 py-2 text-right font-medium text-muted whitespace-nowrap">Shortfall</th>
            <th class="px-3 py-2 text-right font-medium text-muted whitespace-nowrap">Fund Balance</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="rec in collegeRecords"
            :key="rec.age"
            class="border-t border-default"
            :class="rec.college_shortfall > 0 ? 'bg-error/5' : ''"
          >
            <td class="px-3 py-1.5 font-medium whitespace-nowrap">
              {{ rec.age }}
              <UBadge
                v-if="rec.age === inputs.college.draw_start_age"
                size="sm"
                variant="subtle"
                class="ml-1"
              >
                Draws start
              </UBadge>
            </td>
            <td class="px-3 py-1.5 text-right">
              {{ formatCurrency(rec.college_shortfall - rec.college_flow) }}
            </td>
            <td class="px-3 py-1.5 text-right">{{ formatCurrency(-rec.college_flow) }}</td>
            <td class="px-3 py-1.5 text-right" :class="rec.college_shortfall > 0 ? 'text-error' : 'text-muted'">
              {{ formatCurrency(rec.college_shortfall) }}
            </td>
            <td class="px-3 py-1.5 text-right">{{ formatCurrency(rec.college_balance) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </UCard>
</template>
