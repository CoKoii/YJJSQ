<template>
  <div class="holdings-table">
    <a-card title="持仓明细" :bordered="false">
      <!-- 操作栏 -->
      <template #extra>
        <a-space>
          <a-button @click="showUsageModal">
            <template #icon><QuestionCircleOutlined /></template>
            使用说明
          </a-button>

          <a-button @click="handleExport">
            <template #icon><DownloadOutlined /></template>
            导出配置
          </a-button>

          <a-upload :beforeUpload="handleImport" :showUploadList="false" accept=".json">
            <a-button>
              <template #icon><UploadOutlined /></template>
              导入配置
            </a-button>
          </a-upload>

          <a-button type="primary" @click="showAddModal">
            <template #icon><PlusOutlined /></template>
            新增
          </a-button>
        </a-space>
      </template>

      <!-- 表格 -->
      <a-table
        :columns="columns"
        :data-source="fundStore.holdings"
        :pagination="false"
        row-key="id"
        size="small"
        bordered
      >
        <!-- 基金名称 -->
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <div>
              <div style="cursor: pointer; color: #1677ff" @click="showFundDetail(record)">
                {{ record.name }}
              </div>
              <div style="color: #999; font-size: 12px">{{ record.code }}</div>
            </div>
          </template>

          <!-- 大佬持仓金额 / 我的持仓金额 / 我应投入 -->
          <template v-else-if="column.key === 'combinedAmount'">
            <div class="amount-combined">
              <span class="amount-combined__boss">{{ formatMoney(record.bossAmount) }}</span>
              <span class="amount-combined__me">
                <span
                  class="amount-combined__me-actual"
                  :style="{ color: getAmountComparisonColor(record) }"
                >
                  {{ formatMoney(record.myActualAmount) }}
                  <span class="amount-combined__symbol">
                    {{ getAmountComparisonSymbol(record) || '\u00A0' }}
                  </span>
                </span>
                <span class="amount-combined__me-should">{{
                  '应投入：' + formatMoney(getShouldInvest(record.bossAmount))
                }}</span>
              </span>
            </div>
          </template>

          <!-- 占比（大佬 / 我） -->
          <template v-else-if="column.key === 'combinedRatio'">
            <div class="ratio-combined">
              <span class="ratio-combined__boss"
                >{{ formatPercent(getBossRatio(record.bossAmount)) }}%</span
              >
              <span class="ratio-combined__me" :style="{ color: getRatioComparisonColor(record) }">
                <span>{{ formatPercent(getMyRatio(record.myActualAmount)) }}%</span>
                <span class="ratio-symbol">
                  {{ getRatioComparisonSymbol(record) || '\u00A0' }}
                </span>
              </span>
            </div>
          </template>

          <!-- 操作 -->
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleEdit(record)"> 编辑 </a-button>
              <a-button
                type="link"
                size="small"
                class="action-delete"
                @click="handleDelete(record)"
              >
                删除
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 添加/编辑弹窗 -->
    <a-modal
      v-model:open="modalVisible"
      :title="editingRecord ? '编辑持仓' : '新增持仓'"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
      :confirm-loading="saving"
    >
      <a-form ref="formRef" :model="formData" :rules="formRules" layout="vertical">
        <a-form-item label="基金代码" name="code">
          <a-input
            v-model:value="formData.code"
            placeholder="请输入基金代码"
            @blur="handleCodeBlur"
          />
        </a-form-item>

        <a-form-item label="基金名称" name="name">
          <a-input v-model:value="formData.name" placeholder="请输入基金名称" />
        </a-form-item>

        <a-form-item label="大佬持仓金额（元）" name="bossAmount">
          <a-input-number
            v-model:value="formData.bossAmount"
            :min="0"
            :precision="2"
            style="width: 100%"
            placeholder="请输入大佬持仓金额"
          />
        </a-form-item>

        <a-form-item label="我的持仓金额	（元）" name="myActualAmount">
          <a-input-number
            v-model:value="formData.myActualAmount"
            :min="0"
            :precision="2"
            style="width: 100%"
            placeholder="请输入我目前投入的金额"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 删除确认弹窗 -->
    <a-modal
      v-model:open="deleteModalVisible"
      title="确认删除"
      @ok="confirmDelete"
      @cancel="deleteModalVisible = false"
      ok-text="确认删除"
      cancel-text="取消"
      ok-type="danger"
    >
      <p>确定要删除以下持仓吗？</p>
      <div v-if="deletingRecord" style="padding: 12px; background: #f5f5f5; border-radius: 4px">
        <div>
          <strong>{{ deletingRecord.name }}</strong>
        </div>
        <div style="color: #666; font-size: 12px">{{ deletingRecord.code }}</div>
      </div>
    </a-modal>

    <!-- 基金详情弹窗 -->
    <FundDetailModal
      :visible="fundDetailVisible"
      :fundCode="selectedFundCode"
      @update:visible="fundDetailVisible = $event"
    />

    <!-- 使用说明弹窗 -->
    <a-modal v-model:open="usageModalVisible" title="使用说明" :footer="null" width="800px">
      <div class="usage-explanation">
        <div class="color-legend">
          <h4>颜色说明：</h4>
          <div class="legend-item">
            <span class="color-indicator red"></span>
            <span class="legend-text"><strong>红色</strong>：表示投入低于大佬，需要加大投入</span>
          </div>
          <div class="legend-item">
            <span class="color-indicator green"></span>
            <span class="legend-text"><strong>绿色</strong>：表示投入超过大佬的比例</span>
          </div>
        </div>

        <div class="strategy-notes">
          <p>
            除了金额和占比要按比例保持一致外，还有一个重要因素是<strong>持有份额</strong>，这个比较复杂，不便计算，且超过一年的无法操作无法查看，所以只能凭感觉操作。
          </p>

          <div class="strategy-detail">
            <h5>操作方式：</h5>
            <ul>
              <li>
                <strong>低位策略</strong
                >：如果预计比大佬之前的低位还要低，就应该加大投入，适当超过大佬的比例，持有更多份额比
              </li>
              <li>
                <strong>后续调整</strong
                >：下一次如果位置不是很低，可以比大佬少买，甚至不买，来拉回持仓比例
              </li>
              <li><strong>最终目标</strong>：份额/持仓金额/持仓占比就会趋近一致</li>
            </ul>
          </div>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { message } from 'ant-design-vue'
import {
  PlusOutlined,
  DownloadOutlined,
  UploadOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons-vue'
import { useFundStore } from '../stores/fund'
import FundDetailModal from './FundDetailModal.vue'

const fundStore = useFundStore()

// 基金详情弹窗状态
const fundDetailVisible = ref(false)
const selectedFundCode = ref('')

// 使用说明弹窗状态
const usageModalVisible = ref(false)

const columns = [
  {
    title: '基金名称',
    key: 'name',
    width: 240,
  },
  {
    title: '（大佬持仓金额） ： （我的持仓金额）',
    key: 'combinedAmount',
    width: 180,
    align: 'center',
  },
  {
    title: '（大佬占比） ： （我的占比）',
    key: 'combinedRatio',
    width: 180,
    align: 'center',
  },
  {
    title: '操作',
    key: 'action',
    width: 80,
    align: 'center',
  },
]

// 弹窗状态
const modalVisible = ref(false)
const deleteModalVisible = ref(false)
const saving = ref(false)
const editingRecord = ref(null)
const deletingRecord = ref(null)

// 表单相关
const formRef = ref()
const defaultFormState = {
  name: '',
  code: '',
  bossAmount: null,
  myActualAmount: 0,
}

const formData = reactive({ ...defaultFormState })

const formRules = {
  code: [{ required: true, message: '请输入基金代码' }],
  name: [{ required: true, message: '请输入基金名称' }],
  bossAmount: [{ required: true, message: '请输入大佬持仓金额' }],
}

// 表单辅助
function setFormData(partial = {}) {
  Object.assign(formData, defaultFormState, partial)
}

// 格式化金额
function formatMoney(value) {
  if (value == null || isNaN(value)) return ' 0.00'
  return ` ${Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function getRatio(amount, total) {
  if (!total) return 0
  const numericAmount = Number(amount)
  if (!Number.isFinite(numericAmount)) return 0
  return (numericAmount / total) * 100
}

function getBossRatio(amount) {
  return getRatio(amount, fundStore.bossTotal)
}

// 计算我应投入的金额
function getShouldInvest(bossAmount) {
  if (fundStore.bossTotal === 0 || fundStore.bossCurrentTotal === 0) return 0
  const ratio = fundStore.myTotal / fundStore.bossTotal
  return bossAmount * ratio
}

function getMyRatio(myAmount) {
  return getRatio(myAmount, fundStore.myTotal)
}

function formatPercent(value) {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) return '0.00'
  return numericValue.toFixed(2)
}

function compareRatios(record) {
  const bossRatio = getBossRatio(record.bossAmount)
  const myRatio = getMyRatio(record.myActualAmount)

  // 精确到小数点后两位进行比较
  const bossRatioRounded = Math.round(bossRatio * 100) / 100
  const myRatioRounded = Math.round(myRatio * 100) / 100

  if (myRatioRounded > bossRatioRounded) return 'higher'
  if (myRatioRounded < bossRatioRounded) return 'lower'
  return 'equal'
}

function compareAmounts(record) {
  const myAmount = Number(record.myActualAmount) || 0
  const shouldInvest = Number(getShouldInvest(record.bossAmount)) || 0

  // 精确到小数点后两位进行比较
  const myAmountRounded = Math.round(myAmount * 100) / 100
  const shouldInvestRounded = Math.round(shouldInvest * 100) / 100

  if (myAmountRounded < shouldInvestRounded) return 'lower'
  if (myAmountRounded > shouldInvestRounded) return 'higher'
  return 'equal'
}

// 获取占比对比符号
function getRatioComparisonSymbol(record) {
  const comparison = compareRatios(record)

  if (comparison === 'higher') return '↓'
  if (comparison === 'lower') return '↑'
  return ''
}

// 获取占比对比符号的颜色
function getRatioComparisonColor(record) {
  const comparison = compareRatios(record)

  if (comparison === 'higher') return '#52c41a' // 绿色，表示高于大佬占比
  if (comparison === 'lower') return '#ff4d4f' // 红色，表示低于大佬占比
  return 'inherit' // 持平时使用默认颜色
}

function getAmountComparisonSymbol(record) {
  const comparison = compareAmounts(record)

  if (comparison === 'lower') return '↑'
  if (comparison === 'higher') return '↓'
  return ''
}

function getAmountComparisonColor(record) {
  const comparison = compareAmounts(record)

  if (comparison === 'lower') return '#ff4d4f' // 红色，提示应加仓
  if (comparison === 'higher') return '#52c41a' // 绿色，表示已满足或超额
  return '#000000' // 持平时保持默认颜色
}

// 显示基金详情
function showFundDetail(record) {
  selectedFundCode.value = record.code
  fundDetailVisible.value = true
}

// 显示使用说明弹窗
function showUsageModal() {
  usageModalVisible.value = true
}

// 显示添加弹窗
function showAddModal() {
  editingRecord.value = null
  resetForm()
  modalVisible.value = true
}

// 处理编辑
function handleEdit(record) {
  editingRecord.value = record
  const { name, code, bossAmount, myActualAmount } = record
  setFormData({ name, code, bossAmount, myActualAmount })
  modalVisible.value = true
}

// 处理删除
function handleDelete(record) {
  deletingRecord.value = record
  deleteModalVisible.value = true
}

// 确认删除
function confirmDelete() {
  if (deletingRecord.value) {
    fundStore.deleteHolding(deletingRecord.value.id)
    message.success('删除成功')
    deleteModalVisible.value = false
    deletingRecord.value = null
  }
}

// 重置表单
function resetForm() {
  setFormData()
}

// 处理基金代码失焦事件
async function handleCodeBlur() {
  if (formData.code && formData.code.trim()) {
    try {
      const fundInfo = await fundStore.fetchFundInfo(formData.code.trim())
      if (fundInfo && fundInfo.name) {
        formData.name = fundInfo.name
        message.success('已自动填充基金名称')
      }
    } catch (error) {
      console.error('获取基金信息失败:', error)
      message.warning('无法获取基金信息，请手动填写基金名称')
    }
  }
}

// 弹窗确认
async function handleModalOk() {
  try {
    await formRef.value.validate()
    saving.value = true

    const { name, code, bossAmount, myActualAmount } = formData
    const data = {
      name,
      code,
      bossAmount,
      myActualAmount: myActualAmount || 0,
    }

    if (editingRecord.value) {
      // 编辑
      fundStore.updateHolding(editingRecord.value.id, data)
      message.success('更新成功')
    } else {
      // 新增
      fundStore.addHolding(data)
      message.success('新增成功')
    }

    modalVisible.value = false
    resetForm()
  } catch (error) {
    console.log('表单验证失败:', error)
  } finally {
    saving.value = false
  }
}

// 弹窗取消
function handleModalCancel() {
  modalVisible.value = false
  resetForm()
}

// 导出配置
function handleExport() {
  try {
    const config = fundStore.exportConfig()
    const dataStr = JSON.stringify(config, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })

    const link = document.createElement('a')
    link.href = URL.createObjectURL(dataBlob)
    link.download = `基金配置_${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    message.success('配置导出成功！')
  } catch (error) {
    message.error('导出失败：' + error.message)
  }
}

// 导入配置
function handleImport(file) {
  const reader = new FileReader()

  reader.onload = (e) => {
    try {
      const config = JSON.parse(e.target.result)
      fundStore.importConfig(config)
      message.success('配置导入成功！')
    } catch (error) {
      message.error('导入失败，请检查文件格式：' + error.message)
    }
  }

  reader.onerror = () => {
    message.error('文件读取失败')
  }

  reader.readAsText(file)

  // 阻止默认上传行为
  return false
}
</script>

<style scoped>
.holdings-table {
  font-size: 16px;
}

.holdings-table :deep(.ant-table) {
  font-size: 16px;
}

.holdings-table :deep(.ant-table-thead > tr > th) {
  background-color: #fafafa;
  font-weight: 600;
  font-size: 16px;
}

.holdings-table :deep(.ant-table-tbody > tr > td) {
  font-size: 16px;
}

.holdings-table :deep(.ant-table-tbody > tr:hover > td) {
  background-color: #f5f5f5;
}

.holdings-table :deep(.ant-table-fixed-left) {
  box-shadow: 6px 0 6px -4px rgba(0, 0, 0, 0.15);
}

.holdings-table :deep(.ant-table-fixed-right) {
  box-shadow: -6px 0 6px -4px rgba(0, 0, 0, 0.15);
}

.holdings-table :deep(.ratio-symbol) {
  display: inline-block;
  width: 20px;
  text-align: center;
  font-size: 16px;
  font-weight: bold;
  margin-left: 4px;
}

.amount-combined {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  font-weight: 500;
  gap: 8px;
  padding: 0 12px;
}

.amount-combined__boss,
.amount-combined__me {
  flex: 1;
  min-width: 0;
  text-align: left;
}

.amount-combined__boss {
  color: inherit;
}

.amount-combined__me {
  color: #000;
  display: inline-flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.amount-combined__me-actual {
  color: inherit;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 18px;
}

.amount-combined__me-should {
  color: #666;
  font-size: 12px;
}

.amount-combined__symbol {
  display: inline-block;
  width: 20px;
  text-align: center;
  font-size: 16px;
  font-weight: bold;
}

.ratio-combined {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  font-weight: 500;
  gap: 8px;
  padding: 0 12px;
}

.ratio-combined__boss,
.ratio-combined__me {
  flex: 1;
  min-width: 0;
  text-align: left;
}

.ratio-combined__boss {
  color: inherit;
}

.ratio-combined__me {
  color: #000;
  display: inline-flex;
  justify-content: flex-end;
  align-items: center;
  gap: 4px;
}

.holdings-table :deep(.action-delete) {
  color: #999;
  opacity: 0.6;
}

.holdings-table :deep(.action-delete:hover) {
  color: inherit;
}

/* 使用说明弹窗样式 */
.usage-explanation {
  line-height: 1.6;
}

.usage-explanation .color-legend {
  margin-bottom: 24px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #1677ff;
}

.usage-explanation .color-legend h4 {
  margin: 0 0 12px 0;
  color: #262626;
  font-weight: 600;
}

.usage-explanation .legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.usage-explanation .color-indicator {
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  margin-right: 8px;
  border: 1px solid #d9d9d9;
}

.usage-explanation .color-indicator.red {
  background-color: #ff4d4f;
}

.usage-explanation .color-indicator.green {
  background-color: #52c41a;
}

.usage-explanation .legend-text {
  color: #595959;
}

.usage-explanation .strategy-notes p {
  margin-bottom: 16px;
  color: #595959;
}

.usage-explanation .strategy-detail {
  margin: 16px 0;
  padding: 16px;
  background-color: #f6ffed;
  border-radius: 8px;
  border-left: 4px solid #52c41a;
}

.usage-explanation .strategy-detail h5 {
  margin: 0 0 12px 0;
  color: #262626;
  font-weight: 600;
}

.usage-explanation .strategy-detail ul {
  margin: 0;
  padding-left: 20px;
  color: #595959;
}

.usage-explanation .strategy-detail li {
  margin-bottom: 8px;
}
</style>
