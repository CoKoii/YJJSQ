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
        // 获取基金信息的API地址
        const getApiUrl = (code) => {
          // 在开发环境使用代理
          if (import.meta.env.DEV) {
            return `/api/fund/${code}.js`
          } else {
            // 在生产环境下，由于CORS限制，我们需要使用代理服务
            // 使用多个备选代理以提高成功率
            const proxies = [
              `https://api.codetabs.com/v1/proxy?quest=https://fund.eastmoney.com/pingzhongdata/${code}.js`,
              `https://cors.bridged.cc/https://fund.eastmoney.com/pingzhongdata/${code}.js`,
              `https://api.allorigins.win/get?url=${encodeURIComponent(`https://fund.eastmoney.com/pingzhongdata/${code}.js`)}`
            ]
            return proxies[0] // 优先使用第一个代理
          }
        }

        const response = await fetch(getApiUrl(fundCode), {
          method: 'GET',
          headers: {
            'Accept': 'text/plain, application/javascript, */*',
          },
          cache: 'no-cache',
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: 基金代码可能不存在`)
        }
        
        let text
        if (import.meta.env.DEV) {
          text = await response.text()
        } else {
          // 处理不同代理的响应格式
          const responseText = await response.text()
          
          // 检查是否是allorigins的JSON格式响应
          try {
            const jsonData = JSON.parse(responseText)
            if (jsonData.contents) {
              text = jsonData.contents
            } else {
              text = responseText
            }
          } catch {
            // 如果不是JSON，直接使用原始文本
            text = responseText
          }
        }

        // 解析JavaScript文件中的数据
        const nameMatch = text.match(/var fS_name = "([^"]+)"/)
        const codeMatch = text.match(/var fS_code = "([^"]+)"/)

        if (nameMatch && codeMatch) {
          return {
            name: nameMatch[1],
            code: codeMatch[1],
          }
        } else {
          throw new Error('数据格式错误，可能基金代码不存在')
        }
      } catch (error) {
        console.warn('获取基金信息失败:', error)
        
        // 在生产环境提供更友好的错误处理
        if (!import.meta.env.DEV) {
          throw new Error('无法自动获取基金信息，请手动填写基金名称。这通常是由于网络限制或基金代码不存在导致的。')
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
