import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useFundStore = defineStore(
  'fund',
  () => {
    // 基础数据
    const bossTotal = ref(350000) // 大佬总仓位（元）
    const myTotal = ref(3500) // 我的总仓位（元）

    // 持仓明细
    const holdings = ref([
      {
        id: 1,
        name: '华夏恒生科技 ETF 联接 (QDII) C',
        code: '89870',
        bossAmount: 89870, // 大佬持仓金额
        myAmount: 898.7, // 我的投入金额
        myActualAmount: 0, // 我目前投入的金额
      },
      {
        id: 2,
        name: '永赢先进制造智管混合 C',
        code: '63448',
        bossAmount: 63448,
        myAmount: 634.48,
        myActualAmount: 0,
      },
      {
        id: 3,
        name: '嘉实上证科创板50 ETF 联接 C',
        code: '62922',
        bossAmount: 62922,
        myAmount: 629.22,
        myActualAmount: 0,
      },
      {
        id: 4,
        name: '博时中证机器人ETF C',
        code: '25169',
        bossAmount: 25169,
        myAmount: 251.69,
        myActualAmount: 0,
      },
      {
        id: 5,
        name: '易方达创新50 联接 C',
        code: '19769',
        bossAmount: 19769,
        myAmount: 197.69,
        myActualAmount: 0,
      },
      {
        id: 6,
        name: '德邦半导体业混合 C',
        code: '19440',
        bossAmount: 19440,
        myAmount: 194.4,
        myActualAmount: 0,
      },
      {
        id: 7,
        name: '天弘创业板 ETF 联接 C',
        code: '18821',
        bossAmount: 18821,
        myAmount: 188.21,
        myActualAmount: 0,
      },
      {
        id: 8,
        name: '北信瑞丰产业升级聚焦混合型',
        code: '9000',
        bossAmount: 9000,
        myAmount: 90,
        myActualAmount: 0,
      },
      {
        id: 9,
        name: '德邦股票增长灵活配置混合 C',
        code: '3000',
        bossAmount: 3000,
        myAmount: 30,
        myActualAmount: 30,
      },
      {
        id: 10,
        name: '永赢信息产业智管混合 C',
        code: '2000',
        bossAmount: 2000,
        myAmount: 20,
        myActualAmount: 2000,
      },
    ])

    // 计算属性
    const bossCurrentTotal = computed(() => {
      return holdings.value.reduce((sum, item) => sum + item.bossAmount, 0)
    })

    const bossPositionRatio = computed(() => {
      if (!bossTotal.value || bossTotal.value <= 0 || !bossCurrentTotal.value) {
        return '0.00'
      }
      const ratio = (bossCurrentTotal.value / bossTotal.value) * 100
      return isNaN(ratio) ? '0.00' : ratio.toFixed(2)
    })

    const myPositionRatio = computed(() => {
      const myCurrentTotal = holdings.value.reduce(
        (sum, item) => sum + (item.myActualAmount || 0),
        0,
      )
      if (!myTotal.value || myTotal.value <= 0) {
        return '0.00'
      }
      const ratio = (myCurrentTotal / myTotal.value) * 100
      return isNaN(ratio) ? '0.00' : ratio.toFixed(2)
    })

    const positionRatio = computed(() => {
      if (!myTotal.value || myTotal.value <= 0 || !bossTotal.value || bossTotal.value <= 0) {
        return ' 0:0'
      }

      // 计算比例，找到最简分数
      const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b))
      const bossValue = Math.round(bossTotal.value)
      const myValue = Math.round(myTotal.value)
      const divisor = gcd(bossValue, myValue)

      const simplifiedBoss = bossValue / divisor
      const simplifiedMy = myValue / divisor

      return ` ${simplifiedBoss} : ${simplifiedMy}`
    })

    const shouldInvestTotal = computed(() => {
      if (
        !bossCurrentTotal.value ||
        bossCurrentTotal.value <= 0 ||
        !bossTotal.value ||
        bossTotal.value <= 0
      ) {
        return '0.00'
      }
      const ratio = myTotal.value / bossTotal.value
      const result = bossCurrentTotal.value * ratio
      return isNaN(result) ? '0.00' : result.toFixed(2)
    })

    const actualInvestedTotal = computed(() => {
      const total = holdings.value.reduce((sum, item) => sum + (item.myActualAmount || 0), 0)
      return isNaN(total) ? '0.00' : total.toFixed(2)
    })

    // 动作
    function updateBossTotal(value) {
      bossTotal.value = value
    }

    function updateMyTotal(value) {
      myTotal.value = value
    }

    function addHolding(holding) {
      const newId = Math.max(...holdings.value.map((h) => h.id), 0) + 1
      holdings.value.push({
        ...holding,
        id: newId,
      })
    }

    function updateHolding(id, updates) {
      const index = holdings.value.findIndex((h) => h.id === id)
      if (index !== -1) {
        holdings.value[index] = { ...holdings.value[index], ...updates }
      }
    }

    function deleteHolding(id) {
      const index = holdings.value.findIndex((h) => h.id === id)
      if (index !== -1) {
        holdings.value.splice(index, 1)
      }
    }

    function exportConfig() {
      return {
        bossTotal: bossTotal.value,
        myTotal: myTotal.value,
        holdings: holdings.value,
      }
    }

    function importConfig(config) {
      if (config.bossTotal !== undefined) bossTotal.value = config.bossTotal
      if (config.myTotal !== undefined) myTotal.value = config.myTotal
      if (config.holdings && Array.isArray(config.holdings)) {
        holdings.value = config.holdings
      }
    }

    return {
      // 状态
      bossTotal,
      myTotal,
      holdings,
      // 计算属性
      bossCurrentTotal,
      bossPositionRatio,
      myPositionRatio,
      positionRatio,
      shouldInvestTotal,
      actualInvestedTotal,
      // 方法
      updateBossTotal,
      updateMyTotal,
      addHolding,
      updateHolding,
      deleteHolding,
      exportConfig,
      importConfig,
    }
  },
  {
    persist: true,
  },
)
