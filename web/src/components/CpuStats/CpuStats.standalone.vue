<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, shallowRef, watch } from 'vue';
import { useQuery, useSubscription } from '@vue/apollo-composable';
import { GET_CPU_INFO, CPU_METRICS_SUBSCRIPTION } from './cpu-stats.query';
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
  type ChartData
} from 'chart.js';
import { Button, Select } from '@unraid/ui';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const showDetails = ref(true);
const cpuHistory = ref<number[]>([]);

// History duration options
type HistoryDuration = '10s' | '30s' | '1m' | '2m' | '5m';

const historyDuration = ref<HistoryDuration>('30s');

const historyConfigs: Record<HistoryDuration, { points: number; interval: number }> = {
  '10s': { points: 60, interval: 167 },  // ~6 fps
  '30s': { points: 60, interval: 500 },  // 2 fps
  '1m': { points: 60, interval: 1000 },   // 1 fps
  '2m': { points: 60, interval: 2000 },   // 0.5 fps
  '5m': { points: 60, interval: 5000 },   // 0.2 fps
};

const historyOptions = [
  { value: '10s', label: '10 seconds' },
  { value: '30s', label: '30 seconds' },
  { value: '1m', label: '1 minute' },
  { value: '2m', label: '2 minutes' },
  { value: '5m', label: '5 minutes' },
];

const currentHistoryConfig = computed(() => 
  historyConfigs[historyDuration.value] || historyConfigs['30s']
);

const { result: cpuInfoResult } = useQuery(GET_CPU_INFO);
const { result: cpuMetricsResult } = useSubscription(CPU_METRICS_SUBSCRIPTION);

const cpuInfo = computed(() => cpuInfoResult.value?.info?.cpu);
const cpuMetrics = computed(() => cpuMetricsResult.value?.systemMetricsCpu);

const cpuBrand = computed(() => {
  if (!cpuInfo.value) return 'Loading...';
  const brand = cpuInfo.value.brand || cpuInfo.value.model || 'Unknown CPU';
  return brand;
});

const overallLoad = computed(() => {
  if (!cpuMetrics.value) return 0;
  return Math.floor(cpuMetrics.value.percentTotal);
});

const cpuCores = computed(() => {
  if (!cpuMetrics.value?.cpus) return [];
  return cpuMetrics.value.cpus.map((cpu, index) => ({
    index: index * 2, // Assuming HT, so multiply by 2
    htIndex: index * 2 + 1,
    percent: Math.floor(cpu.percentTotal),
    percentUser: Math.floor(cpu.percentUser),
    percentSystem: Math.floor(cpu.percentSystem),
  }));
});

// Keep chart data simple - just the last 60 data points
const chartDataRef = shallowRef<ChartData<'line'>>({
  labels: [],
  datasets: [{
    label: 'CPU Usage %',
    data: [],
    borderColor: '#ff8c2e',
    backgroundColor: 'rgba(255, 140, 46, 0.1)',
    borderWidth: 2,
    fill: true,
    tension: 0.4,
    pointRadius: 0,
    pointHoverRadius: 3,
  }]
});

// Update chart data without triggering computed re-evaluation
const updateChartData = () => {
  // Create simple numeric labels (no timestamps, just indices)
  const labels = Array.from({ length: cpuHistory.value.length }, (_, i) => '');
  
  // Update the ref value directly
  chartDataRef.value = {
    labels,
    datasets: [{
      label: 'CPU Usage %',
      data: [...cpuHistory.value], // Clone to prevent reactivity issues
      borderColor: '#ff8c2e',
      backgroundColor: 'rgba(255, 140, 46, 0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 0, // Disable hover points for performance
    }]
  };
};

const chartData = computed(() => chartDataRef.value);

const chartOptions = computed<ChartOptions<'line'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 0 // Disable all animations for performance
  },
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      enabled: false // Disable tooltips for performance
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      },
      display: false // Hide x-axis completely for performance
    },
    y: {
      min: 0,
      max: 100,
      grid: {
        color: 'rgb(229, 231, 235)'
      },
      ticks: {
        stepSize: 25,
        color: 'rgb(107, 114, 128)',
        font: {
          size: 11
        },
        callback: (value) => `${value}%`
      }
    }
  }
}));

let updateInterval: NodeJS.Timeout | null = null;
let tickInterval: NodeJS.Timeout | null = null;
let lastKnownValue = 0;

// Update with actual data from subscription
const updateFromMetrics = () => {
  if (cpuMetrics.value) {
    lastKnownValue = Math.floor(cpuMetrics.value.percentTotal);
  }
};

// Tick the chart forward with the last known value
const tick = () => {
  // Always push a value (either new or repeated last known)
  cpuHistory.value.push(lastKnownValue);
  
  // Keep only the configured number of data points
  if (cpuHistory.value.length > currentHistoryConfig.value.points) {
    cpuHistory.value.shift();
  }
  
  // Update chart data
  updateChartData();
};

// Watch for actual metric changes
watch(cpuMetrics, updateFromMetrics, { immediate: true });

// Restart ticker when duration changes
const restartTicker = () => {
  if (tickInterval) {
    clearInterval(tickInterval);
  }
  
  // Clear history when changing duration for clean transition
  cpuHistory.value = [];
  
  // Start new ticker with appropriate interval
  tickInterval = setInterval(tick, currentHistoryConfig.value.interval);
};

watch(historyDuration, restartTicker);

onMounted(() => {
  // Start ticker with initial interval
  tickInterval = setInterval(tick, currentHistoryConfig.value.interval);
  tick(); // Initial tick
});

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval);
  }
  if (tickInterval) {
    clearInterval(tickInterval);
  }
});

const toggleDetails = () => {
  showDetails.value = !showDetails.value;
};
</script>

<template>
  <div class="bg-background rounded-md border-2 border-muted shadow-md p-4">
    <div class="space-y-4">
      <!-- Header Section -->
      <div>
        <h3 class="text-lg font-semibold text-foreground">Processor</h3>
        <div class="text-sm text-muted-foreground mt-1">{{ cpuBrand }}</div>
        <div class="flex items-center justify-between mt-2">
          <div class="text-sm">
            <span class="text-foreground">Overall Load: </span>
            <span class="font-semibold" style="color: var(--color-orange, #ff8c2f)">{{ overallLoad }}%</span>
          </div>
          <Button 
            @click="toggleDetails" 
            variant="outline"
            size="sm"
          >
            {{ showDetails ? 'Hide details' : 'Show details' }}
          </Button>
        </div>
      </div>

      <!-- CPU Cores Details -->
      <Transition name="slide-fade">
        <div v-if="showDetails" class="bg-muted/30 rounded-md p-4">
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <div 
              v-for="core in cpuCores" 
              :key="core.index"
              class="bg-background rounded border border-border p-2"
            >
              <div class="text-xs text-muted-foreground">
                CPU {{ core.index }} - HT {{ core.htIndex }}
              </div>
              <div class="text-sm font-semibold mt-1" style="color: var(--color-orange, #ff8c2f)">{{ core.percent }}%</div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Chart Section -->
      <div class="border-t border-border pt-4">
        <div class="flex items-center justify-between mb-3">
          <h4 class="text-sm font-semibold text-foreground">CPU Usage</h4>
          <Select 
            v-model="historyDuration" 
            :items="historyOptions" 
            placeholder="Duration"
            class="w-32"
          />
        </div>
        <div v-if="chartData.labels && chartData.labels.length > 0" class="h-40">
          <Line :data="chartData" :options="chartOptions" />
        </div>
        <div v-else class="h-40 flex items-center justify-center text-muted-foreground text-sm">
          Collecting data...
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Smooth transition for details panel */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from {
  transform: translateY(-10px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}
</style>