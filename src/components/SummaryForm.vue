<template>
  <div class="summary-form">
    <a-card :bordered="false">
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
              :formatter="(value) => ` ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
              :parser="(value) => value.replace(/\s?|(,*)/g, '')"
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
              :formatter="(value) => ` ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
              :parser="(value) => value.replace(/\s?|(,*)/g, '')"
            />
          </a-form-item>
        </a-col>

        <a-col :span="6">
          <a-form-item label="我已投入金额（元）">
            <a-input
              :value="formatMoney(Number(fundStore.actualInvestedTotal))"
              readonly
              style="width: 100%"
            />
          </a-form-item>
        </a-col>

        <a-col :span="6">
          <a-form-item label="我的仓位占比">
            <a-input :value="`${fundStore.myPositionRatio}%`" readonly style="width: 100%" />
          </a-form-item>
        </a-col>

        <a-col :span="6">
          <a-form-item label="我应投入金额（元）">
            <a-input
              :value="formatMoney(Number(fundStore.shouldInvestTotal))"
              readonly
              style="width: 100%"
            />
          </a-form-item>
        </a-col>
      </a-row>
    </a-card>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useFundStore } from '../stores/fund'

const fundStore = useFundStore()

// 本地状态，用于编辑
const localBossTotal = ref(fundStore.bossTotal)
const localMyTotal = ref(fundStore.myTotal)

// 监听 store 变化，同步到本地状态
watch(
  () => fundStore.bossTotal,
  (newVal) => {
    localBossTotal.value = newVal
  },
)

watch(
  () => fundStore.myTotal,
  (newVal) => {
    localMyTotal.value = newVal
  },
)

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
</script>

<style scoped>
.summary-form {
  margin-bottom: 24px;
}

.summary-form .ant-form-item {
  margin-bottom: 0;
}

.summary-form .ant-form-item-label {
  font-weight: 500;
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
</style>
