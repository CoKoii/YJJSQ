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
        name: '示例基金',
        code: '00000',
        bossAmount: 35000, // 大佬持仓金额
        myAmount: 350, // 我的投入金额
        myActualAmount: 350, // 我目前投入的金额
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

    // 根据基金代码获取基金信息
    async function fetchFundInfo(fundCode) {
      try {
        if (!fundCode) {
          throw new Error('基金代码不能为空')
        }

        const data = await new Promise((resolve, reject) => {
          if (typeof window === 'undefined' || typeof document === 'undefined') {
            reject(new Error('当前环境无法发起基金信息请求'))
            return
          }

          const callbackName = 'jsonpgz' // 该接口固定的回调名称
          const prevCallback = window[callbackName]
          const script = document.createElement('script')

          const cleanup = () => {
            if (prevCallback) {
              window[callbackName] = prevCallback
            } else {
              delete window[callbackName]
            }
            script.remove()
          }

          window[callbackName] = (payload) => {
            cleanup()
            if (!payload || !payload.name || !payload.fundcode) {
              reject(new Error('基金数据格式异常'))
              return
            }
            resolve(payload)
          }

          script.src = `https://fundgz.1234567.com.cn/js/${fundCode}.js?rt=${Date.now()}`
          script.onerror = (error) => {
            cleanup()
            reject(error)
          }

          document.head.appendChild(script)
        })

        return {
          name: data.name,
          code: data.fundcode,
        }
      } catch (error) {
        console.warn('获取基金信息失败:', error)

        if (!import.meta.env.DEV) {
          throw new Error(
            '无法自动获取基金信息，请手动填写基金名称。这通常是由于网络限制或基金代码不存在导致的。',
          )
        } else {
          throw new Error('无法获取基金信息，请检查基金代码是否正确')
        }
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
      fetchFundInfo,
    }
  },
  {
    persist: true,
  },
)
