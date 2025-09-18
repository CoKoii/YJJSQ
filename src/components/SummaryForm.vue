<template>
  <div class="summary-form">
    <a-card :bordered="false">
      <a-form layout="vertical">
        <a-row :gutter="[24, 16]">
          <!-- 第一行 -->
          <a-col :span="6">
            <a-form-item label="大佬总仓位（元）">
              <a-input-number
                v-model:value="localBossTotal"
                @change="handleBossTotalChange"
                :min="0"
                :precision="2"
                style="width: 100%"
                :formatter="
                  (value) => (value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '')
                "
                :parser="(value) => (value ? value.replace(/,/g, '') : '')"
              />
            </a-form-item>
          </a-col>

          <a-col :span="6">
            <a-form-item label="当前大佬总投入（元）">
              <a-input
                :value="formatMoney(fundStore.bossCurrentTotal)"
                readonly
                style="width: 100%"
              />
            </a-form-item>
          </a-col>

          <a-col :span="6">
            <a-form-item label="大佬仓位占比">
              <a-input :value="`${fundStore.bossPositionRatio}%`" readonly style="width: 100%" />
            </a-form-item>
          </a-col>

          <a-col :span="6">
            <a-form-item label="大佬仓位：我的仓位">
              <a-input :value="fundStore.positionRatio" readonly style="width: 100%" />
            </a-form-item>
          </a-col>

          <!-- 第二行 -->
          <a-col :span="6">
            <a-form-item label="我的总仓位（元）">
              <a-input-number
                v-model:value="localMyTotal"
                @change="handleMyTotalChange"
                :min="0"
                :precision="2"
                style="width: 100%"
                :formatter="
                  (value) => (value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '')
                "
                :parser="(value) => (value ? value.replace(/,/g, '') : '')"
              />
            </a-form-item>
          </a-col>

          <a-col :span="6">
            <a-form-item label="当前我的总投入（元）">
              <a-input
                :value="formatMoney(Number(fundStore.actualInvestedTotal))"
                readonly
                style="width: 100%"
              />
            </a-form-item>
          </a-col>

          <a-col :span="6">
            <a-form-item label="我的仓位占比">
              <div class="position-ratio-display">
                {{ fundStore.myPositionRatio }}%
                <span class="ratio-symbol" :style="{ color: getPositionRatioComparisonColor() }">
                  {{ getPositionRatioComparisonSymbol() || '\u00A0' }}
                </span>
              </div>
            </a-form-item>
          </a-col>

          <a-col :span="6">
            <a-form-item label="我应投入总金额（元）">
              <a-input
                :value="formatMoney(Number(fundStore.shouldInvestTotal))"
                readonly
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useFundStore } from '../stores/fund'

const fundStore = useFundStore()

// 本地状态，用于编辑
const localBossTotal = ref(fundStore.bossTotal)
const localMyTotal = ref(fundStore.myTotal)

// 格式化金额
function formatMoney(value) {
  if (value == null || isNaN(value)) return ' 0.00'
  return ` ${Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// 处理大佬总仓位变化
function handleBossTotalChange(value) {
  if (value !== null && value !== undefined) {
    fundStore.updateBossTotal(value)
  }
}

// 处理我的总仓位变化
function handleMyTotalChange(value) {
  if (value !== null && value !== undefined) {
    fundStore.updateMyTotal(value)
  }
}

// 获取仓位占比对比符号
function getPositionRatioComparisonSymbol() {
  const bossRatio = parseFloat(fundStore.bossPositionRatio)
  const myRatio = parseFloat(fundStore.myPositionRatio)

  if (myRatio > bossRatio) {
    return '↑'
  } else if (myRatio < bossRatio) {
    return '↓'
  }
  return ''
}

// 获取仓位占比对比符号的颜色
function getPositionRatioComparisonColor() {
  const bossRatio = parseFloat(fundStore.bossPositionRatio)
  const myRatio = parseFloat(fundStore.myPositionRatio)

  if (myRatio > bossRatio) {
    return '#52c41a' // 绿色，表示高于大佬占比
  } else if (myRatio < bossRatio) {
    return '#ff4d4f' // 红色，表示低于大佬占比
  }
  return '#d9d9d9' // 灰色，表示相等
}
</script>

<style scoped>
.summary-form {
  margin-bottom: 24px;
}

.summary-form .ant-form-item {
  margin-bottom: 8px;
}

.summary-form .ant-form-item-label {
  font-weight: 900;
  padding-bottom: 4px;
}

.summary-form .ant-form-item-label > label {
  font-size: 14px;
  color: #262626;
}

/* 只读字段样式 - 无边框 */
.summary-form :deep(.ant-input[readonly]) {
  border: none;
  background-color: transparent;
  box-shadow: none;
  padding-left: 0;
  color: #262626;
  font-weight: 500;
}

.summary-form :deep(.ant-input[readonly]:hover),
.summary-form :deep(.ant-input[readonly]:focus) {
  border: none;
  box-shadow: none;
  background-color: transparent;
}

/* 仓位占比显示样式 */
.position-ratio-display {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  border: none;
  background-color: transparent;
  padding-left: 0;
  color: #262626;
  font-weight: 500;
  height: 32px;
}

.ratio-symbol {
  display: inline-block;
  width: 20px;
  text-align: center;
  font-size: 16px;
  font-weight: bold;
  margin-left: 4px;
}
</style>
