<script setup lang="ts">
const model = useFireModel()

const tabs = [
  { label: 'Wealth Trajectory', icon: 'i-lucide-trending-up', slot: 'wealth' as const, value: 'wealth' },
  { label: 'Retirement Drawdown', icon: 'i-lucide-palmtree', slot: 'retirement' as const, value: 'retirement' },
  { label: 'College', icon: 'i-lucide-graduation-cap', slot: 'college' as const, value: 'college' },
  { label: 'Risk', icon: 'i-lucide-dices', slot: 'risk' as const, value: 'risk' },
  { label: 'Compare', icon: 'i-lucide-git-compare', slot: 'compare' as const, value: 'compare' },
]

// Load the scenario list and the most recent scenario on the server so the
// page arrives fully hydrated. Static builds have no server — bootstrap runs
// client-side against localStorage instead.
await useAsyncData(
  'bootstrap',
  async () => {
    await model.refreshScenarios()
    const id = model.scenarios.value[0]?.id
    if (id) {
      try {
        await model.loadScenario(id)
      } catch {
        // fall back to defaults already in state
      }
    }
    return true
  },
  { server: !model.staticBuild },
)
</script>

<template>
  <div class="min-h-screen bg-default">
    <DemoNotice />
    <header class="sticky top-0 z-20 border-b border-default bg-default/80 backdrop-blur">
      <div class="mx-auto max-w-screen-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-flame" class="size-6 text-primary" />
          <h1 class="text-lg font-semibold text-highlighted">FIRE & Coast FI Planner</h1>
        </div>
        <ScenarioBar />
      </div>
    </header>

    <main class="mx-auto max-w-screen-2xl px-4 py-6 grid grid-cols-1 lg:grid-cols-[20rem_1fr] gap-6 items-start">
      <aside class="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto pr-1">
        <UCard>
          <template #header>
            <h2 class="font-semibold text-highlighted">Assumptions</h2>
          </template>
          <ControlPanel />
        </UCard>
      </aside>

      <div class="space-y-6 min-w-0">
        <KpiSummary />
        <UTabs :items="tabs" default-value="wealth" :unmount-on-hide="false" variant="link" class="w-full">
          <template #wealth>
            <div class="space-y-6 pt-4">
              <GrowthChart />
              <ProjectionTable />
            </div>
          </template>
          <template #retirement>
            <div class="space-y-6 pt-4">
              <RetirementChart />
              <RetirementTable />
            </div>
          </template>
          <template #college>
            <div class="space-y-6 pt-4">
              <CollegeChart />
              <CollegeTable />
            </div>
          </template>
          <template #risk>
            <div class="pt-4">
              <RiskPanel />
            </div>
          </template>
          <template #compare>
            <div class="pt-4">
              <ComparePanel />
            </div>
          </template>
        </UTabs>
      </div>
    </main>
  </div>
</template>
