<script setup lang="ts">
const { staticBuild } = useFireModel()

// Shown on every page load of the public static build — the numbers on
// screen are a fictional demo household, and visitors must know that.
const open = ref(false)

onMounted(() => {
  if (staticBuild) open.value = true
})
</script>

<template>
  <UModal v-model:open="open" :dismissible="false" title="These numbers are not real">
    <template #body>
      <div class="space-y-3 text-sm">
        <p>
          Everything you see is <strong>fictional demo data</strong>: a
          22-year-old college grad starting a $65,000 job with regular raises
          and <strong>nothing invested yet</strong>. The point of the demo is
          what the math shows — steady saving from an ordinary salary still
          reaches financial independence in the mid-40s, far before the
          traditional retirement age.
        </p>
        <p>
          To model your own situation, adjust the inputs in the sidebar, or use
          the <UIcon name="i-lucide-upload" class="inline size-4 align-text-bottom" />
          <strong> Import</strong> button to load a scenario JSON you exported
          earlier. Your numbers stay in <strong>your browser only</strong> —
          nothing is uploaded anywhere.
        </p>
        <p class="text-muted">
          This is a modeling tool, not financial advice.
        </p>
      </div>
    </template>
    <template #footer>
      <UButton block @click="open = false">Got it — show me the demo</UButton>
    </template>
  </UModal>
</template>
