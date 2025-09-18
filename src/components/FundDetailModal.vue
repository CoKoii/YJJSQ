<template>
  <a-modal
    :open="visible"
    :title="`${fundInfo.name} (${fundInfo.code})`"
    width="600px"
    @cancel="handleClose"
    :footer="null"
  >
    <div v-if="loading" class="loading-container">
      <a-spin size="large" />
    </div>

    <div v-else-if="fundInfo.code" class="fund-detail">
      <!-- 基金基本信息 -->
      <div class="fund-info">
        <a-row :gutter="12">
          <a-col :span="6">
            <div class="info-item compact">
              <span class="label">近1年涨跌幅:</span>
              <span class="value" :class="fundInfo.yearlyReturn >= 0 ? 'positive' : 'negative'">
                {{ fundInfo.yearlyReturn >= 0 ? '+' : '' }}{{ fundInfo.yearlyReturn }}%
              </span>
            </div>
          </a-col>
          <a-col :span="6">
            <div class="info-item compact">
              <span class="label">成立以来涨跌幅:</span>
              <span class="value" :class="fundInfo.totalReturn >= 0 ? 'positive' : 'negative'">
                {{ fundInfo.totalReturn >= 0 ? '+' : '' }}{{ fundInfo.totalReturn }}%
              </span>
            </div>
          </a-col>
          <a-col :span="6">
            <div class="info-item compact">
              <span class="label">日涨跌幅:</span>
              <span class="value" :class="fundInfo.dailyReturn >= 0 ? 'positive' : 'negative'">
                {{ fundInfo.dailyReturn >= 0 ? '+' : '' }}{{ fundInfo.dailyReturn }}%
              </span>
            </div>
          </a-col>
          <a-col :span="6">
            <div class="info-item compact">
              <span class="label">最新净值:</span>
              <span class="value">{{ fundInfo.netValue }}</span>
            </div>
          </a-col>
        </a-row>
      </div>

      <!-- 标签页 -->
      <a-tabs v-model:activeKey="activeTab" class="fund-tabs" @change="handleTabChange">
        <a-tab-pane key="performance" tab="业绩走势">
          <div class="performance-container">
            <!-- 时间段选择 -->
            <div class="time-selector">
              <a-radio-group
                v-model:value="performancePeriod"
                @change="handlePerformancePeriodChange"
              >
                <a-radio-button value="1m">近1月</a-radio-button>
                <a-radio-button value="3m">近3月</a-radio-button>
                <a-radio-button value="6m">近6月</a-radio-button>
                <a-radio-button value="1y">近1年</a-radio-button>
                <a-radio-button value="ytd">今年来</a-radio-button>
                <a-radio-button value="all">成立以来</a-radio-button>
              </a-radio-group>
            </div>
            <!-- 业绩走势图表 -->
            <div ref="performanceChart" class="chart-container"></div>
          </div>
        </a-tab-pane>

        <a-tab-pane key="netValue" tab="净值走势">
          <div class="net-value-container">
            <!-- 时间段选择 -->
            <div class="time-selector">
              <a-radio-group v-model:value="netValuePeriod" @change="handleNetValuePeriodChange">
                <a-radio-button value="1m">近1月</a-radio-button>
                <a-radio-button value="3m">近3月</a-radio-button>
                <a-radio-button value="6m">近6月</a-radio-button>
                <a-radio-button value="1y">近1年</a-radio-button>
                <a-radio-button value="ytd">今年来</a-radio-button>
                <a-radio-button value="all">成立以来</a-radio-button>
              </a-radio-group>
            </div>
            <!-- 净值走势图表 -->
            <div ref="netValueChart" class="chart-container"></div>
          </div>
        </a-tab-pane>
      </a-tabs>
    </div>
  </a-modal>
</template>

<script setup>
import { ref, watch, nextTick, onUnmounted } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  fundCode: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:visible'])

// 响应式数据
const loading = ref(false)
const activeTab = ref('performance')
const performancePeriod = ref('3m')
const netValuePeriod = ref('3m')

// 图表实例
const performanceChart = ref(null)
const netValueChart = ref(null)
let performanceChartInstance = null
let netValueChartInstance = null

// 基金信息
const fundInfo = ref({
  name: '',
  code: '',
  totalReturn: 0,
  dailyReturn: 0,
  netValue: 0,
})

// 基金数据
const fundData = ref({
  netWorthTrend: [],
  performanceData: [],
})

// 监听弹窗显示状态
watch(
  () => props.visible,
  async (newValue) => {
    if (newValue && props.fundCode) {
      await loadFundData()
    }
  },
)

// 监听基金代码变化
watch(
  () => props.fundCode,
  async (newCode) => {
    if (newCode && props.visible) {
      await loadFundData()
    }
  },
)

// 加载基金数据
async function loadFundData() {
  if (!props.fundCode) return

  loading.value = true
  try {
    const data = await fetchFundData(props.fundCode)
    fundInfo.value = {
      name: data.name,
      code: data.code,
      yearlyReturn: calculateYearlyReturn(data.netWorthTrend),
      totalReturn: calculateTotalReturn(data.netWorthTrend),
      dailyReturn: calculateDailyReturn(data.netWorthTrend),
      netValue: getLatestNetValue(data.netWorthTrend),
    }
    fundData.value = data

    // 等待DOM更新后初始化图表
    await nextTick()
    // 确保在下一个事件循环中初始化图表，以确保容器已经渲染
    setTimeout(() => {
      // 销毁之前的图表实例
      destroyCharts()
      initCharts()
    }, 150)
  } catch (error) {
    console.error('加载基金数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取基金数据
async function fetchFundData(fundCode) {
  try {
    // 获取基金数据的API地址
    const getApiUrl = (code) => {
      // 在开发环境使用代理，在生产环境直接访问东方财富
      if (import.meta.env.DEV) {
        return `/api/fund/${code}.js`
      } else {
        // 在生产环境下直接访问东方财富的接口
        return `https://fund.eastmoney.com/pingzhongdata/${code}.js`
      }
    }

    // 尝试使用 fetch 直接获取
    const response = await fetch(getApiUrl(fundCode), {
      method: 'GET',
      mode: 'cors', // 允许跨域
      cache: 'no-cache',
    })

    if (!response.ok) {
      throw new Error('基金数据获取失败')
    }

    const text = await response.text()

    // 解析JavaScript文件中的数据
    const nameMatch = text.match(/var fS_name = "([^"]+)"/)
    const codeMatch = text.match(/var fS_code = "([^"]+)"/)
    const netWorthMatch = text.match(/var Data_netWorthTrend = (\[.*?\]);/)

    const name = nameMatch ? nameMatch[1] : fundCode
    const code = codeMatch ? codeMatch[1] : fundCode

    let netWorthTrend = []
    if (netWorthMatch) {
      try {
        // 清理并解析净值数据
        const cleanedData = netWorthMatch[1].replace(/,\s*\]/g, ']')
        netWorthTrend = JSON.parse(cleanedData)
      } catch (e) {
        console.error('解析净值数据失败:', e)
      }
    }

    return {
      name,
      code,
      netWorthTrend,
      performanceData: generatePerformanceData(netWorthTrend),
    }
  } catch (error) {
    console.error('获取基金数据失败:', error)
    throw new Error('由于网络限制无法获取基金详细数据，请稍后重试')
  }
} // 生成业绩数据
function generatePerformanceData(netWorthTrend) {
  if (!netWorthTrend || netWorthTrend.length === 0) return []

  const baseValue = netWorthTrend[0]?.y || 1
  return netWorthTrend.map((item) => ({
    x: item.x,
    y: (((item.y - baseValue) / baseValue) * 100).toFixed(2),
  }))
}

// 计算成立以来总收益率
function calculateTotalReturn(netWorthTrend) {
  if (!netWorthTrend || netWorthTrend.length < 2) return 0

  const firstValue = netWorthTrend[0]?.y || 1
  const lastValue = netWorthTrend[netWorthTrend.length - 1]?.y || firstValue

  return (((lastValue - firstValue) / firstValue) * 100).toFixed(2)
}

// 计算近1年涨跌幅
function calculateYearlyReturn(netWorthTrend) {
  if (!netWorthTrend || netWorthTrend.length < 2) return 0

  // 使用与filterDataByPeriod相同的逻辑
  // 找到最后一个交易日（数据中的最新日期）
  const latestDataPoint = netWorthTrend[netWorthTrend.length - 1]
  const endDate = new Date(latestDataPoint.x)

  // 从最新交易日往前推1年
  const targetDate = new Date(endDate)
  targetDate.setFullYear(endDate.getFullYear() - 1)

  // 如果目标日期是周末或没有数据，向前找最近的交易日
  const nearestTradingDay = findNearestTradingDay(netWorthTrend, targetDate, true)
  const startValue = nearestTradingDay ? nearestTradingDay.y : netWorthTrend[0]?.y || 1

  const endValue = latestDataPoint.y || startValue

  return (((endValue - startValue) / startValue) * 100).toFixed(2)
}

// 计算日涨跌幅
function calculateDailyReturn(netWorthTrend) {
  if (!netWorthTrend || netWorthTrend.length < 2) return 0

  const lastIndex = netWorthTrend.length - 1
  const lastValue = netWorthTrend[lastIndex]?.y || 0
  const prevValue = netWorthTrend[lastIndex - 1]?.y || lastValue

  if (prevValue === 0) return 0
  return (((lastValue - prevValue) / prevValue) * 100).toFixed(2)
}

// 获取最新净值
function getLatestNetValue(netWorthTrend) {
  if (!netWorthTrend || netWorthTrend.length === 0) return 0
  return netWorthTrend[netWorthTrend.length - 1]?.y?.toFixed(4) || 0
}

// 初始化图表
function initCharts() {
  // 根据当前激活的标签页初始化对应的图表
  nextTick(() => {
    if (activeTab.value === 'performance') {
      initPerformanceChart()
    } else if (activeTab.value === 'netValue') {
      initNetValueChart()
    }

    // 延迟初始化另一个图表，避免同时初始化导致问题
    setTimeout(() => {
      if (activeTab.value === 'performance') {
        initNetValueChart()
      } else {
        initPerformanceChart()
      }
    }, 200)
  })
}

// 初始化业绩走势图表
function initPerformanceChart() {
  if (!performanceChart.value) return

  // 如果图表实例已存在，先销毁
  if (performanceChartInstance) {
    performanceChartInstance.dispose()
    performanceChartInstance = null
  }

  // 确保容器有尺寸且可见
  if (performanceChart.value.offsetWidth === 0 || performanceChart.value.offsetHeight === 0) {
    setTimeout(() => initPerformanceChart(), 100)
    return
  }

  try {
    performanceChartInstance = echarts.init(performanceChart.value)
    updatePerformanceChart()
  } catch (error) {
    console.error('初始化业绩图表失败:', error)
    // 重试一次
    setTimeout(() => initPerformanceChart(), 200)
  }
}

// 初始化净值走势图表
function initNetValueChart() {
  if (!netValueChart.value) return

  // 如果图表实例已存在，先销毁
  if (netValueChartInstance) {
    netValueChartInstance.dispose()
    netValueChartInstance = null
  }

  // 确保容器有尺寸且可见
  if (netValueChart.value.offsetWidth === 0 || netValueChart.value.offsetHeight === 0) {
    setTimeout(() => initNetValueChart(), 100)
    return
  }

  try {
    netValueChartInstance = echarts.init(netValueChart.value)
    updateNetValueChart()
  } catch (error) {
    console.error('初始化净值图表失败:', error)
    // 重试一次
    setTimeout(() => initNetValueChart(), 200)
  }
}

// 处理业绩时间段变化
function handlePerformancePeriodChange() {
  if (!performanceChartInstance) {
    initPerformanceChart()
  } else {
    updatePerformanceChart()
  }
}

// 处理净值时间段变化
function handleNetValuePeriodChange() {
  if (!netValueChartInstance) {
    initNetValueChart()
  } else {
    updateNetValueChart()
  }
}

// 处理标签页切换
function handleTabChange(activeKey) {
  activeTab.value = activeKey

  // 延迟一点时间确保DOM已经更新
  setTimeout(() => {
    if (activeKey === 'performance') {
      // 如果图表实例不存在或容器不可见，重新初始化
      if (
        !performanceChartInstance ||
        !performanceChart.value ||
        performanceChart.value.offsetWidth === 0
      ) {
        initPerformanceChart()
      } else {
        // 图表存在但可能需要resize
        performanceChartInstance.resize()
        updatePerformanceChart()
      }
    } else if (activeKey === 'netValue') {
      // 如果图表实例不存在或容器不可见，重新初始化
      if (!netValueChartInstance || !netValueChart.value || netValueChart.value.offsetWidth === 0) {
        initNetValueChart()
      } else {
        // 图表存在但可能需要resize
        netValueChartInstance.resize()
        updateNetValueChart()
      }
    }
  }, 100)
}

// 销毁图表实例
function destroyCharts() {
  if (performanceChartInstance) {
    performanceChartInstance.dispose()
    performanceChartInstance = null
  }
  if (netValueChartInstance) {
    netValueChartInstance.dispose()
    netValueChartInstance = null
  }
}

// 更新业绩走势图表
function updatePerformanceChart() {
  if (!performanceChartInstance || !fundData.value.performanceData) return

  const filteredData = filterDataByPeriod(fundData.value.performanceData, performancePeriod.value)

  // 为category类型的x轴准备数据
  const xAxisData = filteredData.map((item) => {
    const date = new Date(item.x)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()

    // 始终显示年-月-日格式
    return `${year}-${month}-${day}`
  })
  const seriesData = filteredData.map((item) => parseFloat(item.y))

  const option = {
    title: {
      text: '业绩走势',
      left: 'center',
      textStyle: {
        fontSize: 16,
      },
    },
    tooltip: {
      trigger: 'axis',
      formatter: function (params) {
        const dateLabel = params[0].axisValue // 已经是格式化的"月-日"
        const value = params[0].data
        return `${dateLabel}<br/>收益率: ${value}%`
      },
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: xAxisData,
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        formatter: function (value) {
          // 直接返回已格式化的值
          return value
        },
      },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '{value}%',
      },
      axisLine: {
        show: false,
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: '#f0f0f0',
          width: 1,
          type: 'solid',
        },
      },
      splitNumber: 5,
    },
    series: [
      {
        type: 'line',
        smooth: false,
        symbol: 'none',
        lineStyle: {
          width: 2,
          color: '#1890ff',
        },
        areaStyle: {
          origin: 'start',
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: 'rgba(24, 144, 255, 0.3)', // 线条位置透明度0.3
              },
              {
                offset: 1,
                color: 'rgba(24, 144, 255, 0)', // 底部完全透明
              },
            ],
          },
        },
        data: seriesData,
      },
    ],
  }

  performanceChartInstance.setOption(option, true) // 使用 true 参数强制重新渲染
  // 调用 resize 确保图表正确显示
  setTimeout(() => {
    if (performanceChartInstance) {
      performanceChartInstance.resize()
    }
  }, 100)
}

// 更新净值走势图表
function updateNetValueChart() {
  if (!netValueChartInstance || !fundData.value.netWorthTrend) return

  const filteredData = filterDataByPeriod(fundData.value.netWorthTrend, netValuePeriod.value)

  // 为category类型的x轴准备数据
  const xAxisData = filteredData.map((item) => {
    const date = new Date(item.x)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()

    // 始终显示年-月-日格式
    return `${year}-${month}-${day}`
  })
  const seriesData = filteredData.map((item) => parseFloat(item.y))

  const option = {
    title: {
      text: '净值走势',
      left: 'center',
      textStyle: {
        fontSize: 16,
      },
    },
    tooltip: {
      trigger: 'axis',
      formatter: function (params) {
        const date = new Date(params[0].axisValue).toLocaleDateString()
        const value = params[0].data
        return `${date}<br/>净值: ${value}`
      },
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: xAxisData,
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        formatter: function (value) {
          // 直接返回已格式化的值
          return value
        },
        interval: 4, // 控制标签显示间隔，每5个标签显示一个
        rotate: 45, // 斜着显示，旋转45度
      },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '{value}',
      },
      axisLine: {
        show: false,
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: '#f0f0f0',
          width: 1,
          type: 'solid',
        },
      },
      splitNumber: 5,
    },
    series: [
      {
        type: 'line',
        smooth: false,
        symbol: 'none',
        lineStyle: {
          width: 2,
          color: '#52c41a',
        },
        areaStyle: {
          origin: 'start',
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: 'rgba(82, 196, 26, 0.3)', // 线条位置透明度0.3
              },
              {
                offset: 1,
                color: 'rgba(82, 196, 26, 0)', // 底部完全透明
              },
            ],
          },
        },
        data: seriesData,
      },
    ],
  }

  netValueChartInstance.setOption(option, true) // 使用 true 参数强制重新渲染
  // 调用 resize 确保图表正确显示
  setTimeout(() => {
    if (netValueChartInstance) {
      netValueChartInstance.resize()
    }
  }, 100)
}

// 找到最近的有数据的交易日
function findNearestTradingDay(data, targetDate, searchBackward = true) {
  if (!data || data.length === 0) return null

  let bestMatch = null
  let minDiff = Infinity

  for (const item of data) {
    const itemDate = new Date(item.x)
    const diff = Math.abs(itemDate.getTime() - targetDate.getTime())

    if (searchBackward) {
      // 向前查找：目标日期之前的最近交易日
      if (itemDate <= targetDate && diff < minDiff) {
        minDiff = diff
        bestMatch = item
      }
    } else {
      // 向后查找：目标日期之后的最近交易日
      if (itemDate >= targetDate && diff < minDiff) {
        minDiff = diff
        bestMatch = item
      }
    }
  }

  return bestMatch
}

// 判断是否为交易日（周一到周五）
function isTradingDay(date) {
  const day = date.getDay()
  return day >= 1 && day <= 5 // 周一(1)到周五(5)
}

// 过滤非交易日数据
function filterTradingDaysOnly(data) {
  return data.filter((item) => {
    const date = new Date(item.x)
    return isTradingDay(date)
  })
}

// 根据时间段过滤数据
function filterDataByPeriod(data, period) {
  if (!data || data.length === 0) return []

  // 找到最后一个交易日（数据中的最新日期）
  const latestDataPoint = data[data.length - 1]
  const endDate = new Date(latestDataPoint.x)

  let startDate = null

  switch (period) {
    case '1m': {
      // 近1月：从最新交易日往前推1个自然月
      const targetDate = new Date(endDate)
      targetDate.setMonth(endDate.getMonth() - 1)

      // 如果目标日期是周末或没有数据，向前找最近的交易日
      const nearestTradingDay = findNearestTradingDay(data, targetDate, true)
      startDate = nearestTradingDay ? new Date(nearestTradingDay.x) : targetDate
      break
    }
    case '3m': {
      // 近3月：从最新交易日往前推3个自然月
      const targetDate = new Date(endDate)
      targetDate.setMonth(endDate.getMonth() - 3)

      const nearestTradingDay = findNearestTradingDay(data, targetDate, true)
      startDate = nearestTradingDay ? new Date(nearestTradingDay.x) : targetDate
      break
    }
    case '6m': {
      // 近6月：从最新交易日往前推6个自然月
      const targetDate = new Date(endDate)
      targetDate.setMonth(endDate.getMonth() - 6)

      const nearestTradingDay = findNearestTradingDay(data, targetDate, true)
      startDate = nearestTradingDay ? new Date(nearestTradingDay.x) : targetDate
      break
    }
    case '1y': {
      // 近1年：从最新交易日往前推1年
      const targetDate = new Date(endDate)
      targetDate.setFullYear(endDate.getFullYear() - 1)

      const nearestTradingDay = findNearestTradingDay(data, targetDate, true)
      startDate = nearestTradingDay ? new Date(nearestTradingDay.x) : targetDate
      break
    }
    case 'ytd': {
      // 今年来：从今年1月1日开始，如果1月1日没有数据，找最近的交易日
      const currentYear = new Date().getFullYear()
      const targetDate = new Date(currentYear, 0, 1) // 1月1日

      const nearestTradingDay = findNearestTradingDay(data, targetDate, false) // 向后查找
      startDate = nearestTradingDay ? new Date(nearestTradingDay.x) : targetDate
      break
    }
    case 'all':
    default:
      // 对于"成立以来"选项，只过滤掉非交易日
      return filterTradingDaysOnly(data)
  }

  // 先按时间段过滤，再过滤掉非交易日
  const filteredByTime = data.filter((item) => {
    const itemDate = new Date(item.x)
    return itemDate >= startDate && itemDate <= endDate
  })

  return filterTradingDaysOnly(filteredByTime)
}

// 关闭弹窗
function handleClose() {
  destroyCharts()
  emit('update:visible', false)
}

// 组件卸载时销毁图表
onUnmounted(() => {
  destroyCharts()
})
</script>

<style scoped>
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.fund-detail {
  max-height: 600px;
  overflow-y: auto;
}

.fund-info {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 6px;
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  text-align: center;
}

.info-item.compact {
  margin-bottom: 8px;
}

.info-item.compact .label {
  font-size: 12px;
  color: #888;
  order: 2;
  margin-top: 4px;
}

.info-item.compact .value {
  font-size: 16px;
  font-weight: 600;
  order: 1;
}

.info-item:last-child {
  margin-bottom: 0;
}

.label {
  color: #666;
  font-size: 14px;
}

.value {
  font-weight: 500;
  font-size: 16px;
}

.positive {
  color: #f5222d;
}

.negative {
  color: #52c41a;
}

.fund-tabs {
  margin-top: 16px;
}

.time-selector {
  margin-bottom: 16px;
  text-align: center;
}

.chart-container {
  height: 350px;
  width: 100%;
}

.performance-container,
.net-value-container {
  padding: 16px 0;
}
</style>
