<template>
  <div class="chart-wrapper" :style="{ height: height }">
    <canvas ref="canvasRef" />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import {
  Chart,
  ArcElement,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
  BarController,
  LineController,
  DoughnutController,
} from 'chart.js'

Chart.register(ArcElement, BarElement, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler, BarController, LineController, DoughnutController)

const props = defineProps({
  /** Chart type: 'doughnut' | 'bar' | 'line' */
  type: { type: String, required: true },
  /** Chart.js data: { labels, datasets } */
  data: { type: Object, default: () => ({ labels: [], datasets: [] }) },
  /** Chart.js options (merged with defaults) */
  options: { type: Object, default: () => ({}) },
  /** Canvas height (e.g. '240px') */
  height: { type: String, default: '240px' },
})

const canvasRef = ref(null)
let chartInstance = null

const defaultOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'bottom',
      labels: {
        boxWidth: 12,
        padding: 10,
        font: { size: 11, weight: '400' },
        color: '#64748b',
      },
    },
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      titleFont: { size: 12 },
      bodyFont: { size: 11 },
      padding: 8,
    },
  },
  scales: {},
}

function buildOptions() {
  const base = { ...defaultOptions, ...props.options }
  const scaleCommon = {
    grid: { color: 'rgba(0,0,0,0.05)' },
    ticks: { font: { size: 11, weight: '400' }, color: '#94a3b8' },
  }
  if (props.type === 'bar') {
    base.scales = {
      x: { ...scaleCommon, grid: { display: false }, ticks: { ...scaleCommon.ticks, maxRotation: 45 } },
      y: { ...scaleCommon, beginAtZero: true },
    }
  }
  if (props.type === 'line') {
    base.scales = {
      x: { ...scaleCommon, grid: { display: false } },
      y: { ...scaleCommon, beginAtZero: true },
    }
  }
  return base
}

function init() {
  if (!canvasRef.value || !props.data?.datasets?.length) return
  // Garante registro no mesmo contexto do Chart usado aqui (evita "bar/line is not a registered controller" com code-split).
  Chart.register(ArcElement, BarElement, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler, BarController, LineController, DoughnutController)
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }
  chartInstance = new Chart(canvasRef.value, {
    type: props.type,
    data: props.data,
    options: buildOptions(),
  })
}

onMounted(() => init())
onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }
})

watch(
  () => [props.data, props.options],
  () => init(),
  { deep: true }
)
</script>

<style scoped>
.chart-wrapper {
  position: relative;
  width: 100%;
  min-height: 160px;
}
</style>
