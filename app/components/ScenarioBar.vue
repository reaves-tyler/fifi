<script setup lang="ts">
const model = useFireModel()
const { scenarios, scenarioId, scenarioName } = model
const toast = useToast()

const saving = ref(false)

const scenarioItems = computed(() =>
  scenarios.value.map(s => ({ label: s.name, value: s.id })),
)

async function onSelect(id: string) {
  try {
    await model.loadScenario(id)
  } catch {
    toast.add({ title: 'Failed to load scenario', color: 'error' })
  }
}

async function onSave() {
  saving.value = true
  try {
    await model.saveScenario()
    toast.add({ title: `Saved “${scenarioName.value}”`, color: 'success' })
  } catch {
    toast.add({ title: 'Save failed', color: 'error' })
  } finally {
    saving.value = false
  }
}

async function onSaveAs() {
  saving.value = true
  try {
    await model.saveScenarioAs(scenarioName.value)
    toast.add({ title: `Created “${scenarioName.value}”`, color: 'success' })
  } catch {
    toast.add({ title: 'Save failed', color: 'error' })
  } finally {
    saving.value = false
  }
}

async function onDelete() {
  try {
    await model.deleteScenario()
    toast.add({ title: 'Scenario deleted', color: 'success' })
  } catch {
    toast.add({ title: 'Delete failed', color: 'error' })
  }
}

function exportToFile() {
  const payload = model.exportScenario()
  const slug = (payload.name || 'scenario').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${slug || 'scenario'}.json`
  a.click()
  URL.revokeObjectURL(url)
  toast.add({ title: 'Scenario exported', color: 'success' })
}

const importInput = ref<HTMLInputElement | null>(null)

async function onImportFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  try {
    model.importScenario(JSON.parse(await file.text()))
    toast.add({ title: `Imported “${scenarioName.value}” — hit Save to keep it`, color: 'success' })
  } catch {
    toast.add({ title: 'Import failed — not a valid scenario JSON', color: 'error' })
  } finally {
    if (importInput.value) importInput.value.value = ''
  }
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <USelectMenu
      :model-value="scenarioId ?? undefined"
      :items="scenarioItems"
      value-key="value"
      placeholder="Scenarios"
      class="w-44"
      @update:model-value="onSelect"
    />
    <UInput v-model="scenarioName" placeholder="Scenario name" class="w-44" />
    <UButton :loading="saving" icon="i-lucide-save" @click="onSave">Save</UButton>
    <UButton variant="soft" icon="i-lucide-copy-plus" @click="onSaveAs">Save as new</UButton>
    <UButton variant="soft" icon="i-lucide-file-plus" @click="model.newScenario()">New</UButton>
    <UTooltip text="Export scenario to a JSON file">
      <UButton variant="soft" color="neutral" icon="i-lucide-download" @click="exportToFile" />
    </UTooltip>
    <UTooltip text="Import a scenario JSON file">
      <UButton variant="soft" color="neutral" icon="i-lucide-upload" @click="importInput?.click()" />
    </UTooltip>
    <input
      ref="importInput"
      type="file"
      accept="application/json,.json"
      class="hidden"
      @change="onImportFile"
    >
    <UButton
      v-if="scenarioId"
      variant="ghost"
      color="error"
      icon="i-lucide-trash-2"
      @click="onDelete"
    />
  </div>
</template>
