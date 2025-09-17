<template>
  <div class="holdings-table">
    <a-card title="持仓明细" :bordered="false">
      <!-- 操作栏 -->
      <template #extra>
        <a-space>
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
      >
        <!-- 基金名称 -->
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <div>
              <div style="font-weight: 500">{{ record.name }}</div>
              <div style="color: #999; font-size: 12px">{{ record.code }}</div>
            </div>
          </template>

          <!-- 大佬持仓金额 -->
          <template v-else-if="column.key === 'bossAmount'">
            <span style="color: #ff4d4f; font-weight: 500">{{
              formatMoney(record.bossAmount)
            }}</span>
          </template>

          <!-- 占比 -->
          <template v-else-if="column.key === 'ratio'">
            <span style="font-weight: bold">{{ getBossRatio(record.bossAmount) }}%</span>
          </template>

          <!-- 我应投入 -->
          <template v-else-if="column.key === 'shouldInvest'">
            <span>{{ formatMoney(getShouldInvest(record.bossAmount)) }}</span>
          </template>

          <!-- 我目前投入 -->
          <template v-else-if="column.key === 'myActualAmount'">
            <span
              :style="{
                color:
                  record.myActualAmount < getShouldInvest(record.bossAmount)
                    ? '#ff4d4f'
                    : 'inherit',
                fontWeight: '500',
              }"
              >{{ formatMoney(record.myActualAmount) }}</span
            >
          </template>

          <!-- 我的投入占比 -->
          <template v-else-if="column.key === 'myRatio'">
            <span style="font-weight: bold">{{ getMyRatio(record.myActualAmount) }}%</span>
          </template>

          <!-- 操作 -->
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleEdit(record)"> 编辑 </a-button>
              <a-button type="link" size="small" danger @click="handleDelete(record)">
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
        <a-form-item label="基金名称" name="name">
          <a-input v-model:value="formData.name" placeholder="请输入基金名称" />
        </a-form-item>

        <a-form-item label="基金代码" name="code">
          <a-input v-model:value="formData.code" placeholder="请输入基金代码" />
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

        <a-form-item label="我目前投入金额（元）" name="myActualAmount">
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
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons-vue'
import { useFundStore } from '../stores/fund'

const fundStore = useFundStore()

const columns = [
  {
    title: '基金名称',
    key: 'name',
    width: 180,
  },
  {
    title: '大佬持仓金额',
    key: 'bossAmount',
    width: 80,
    align: 'center',
  },
  {
    title: '占比',
    key: 'ratio',
    width: 80,
    align: 'center',
  },
  {
    title: '我的持仓金额',
    key: 'myActualAmount',
    width: 80,
    align: 'center',
  },
  {
    title: '占比',
    key: 'myRatio',
    width: 80,
    align: 'center',
  },
  {
    title: '我应投入',
    key: 'shouldInvest',
    width: 80,
    align: 'center',
  },
  {
    title: '操作',
    key: 'action',
    width: 60,
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
const formData = reactive({
  name: '',
  code: '',
  bossAmount: null,
  myActualAmount: 0,
})

const formRules = {
  name: [{ required: true, message: '请输入基金名称' }],
  code: [{ required: true, message: '请输入基金代码' }],
  bossAmount: [{ required: true, message: '请输入大佬持仓金额' }],
}

// 格式化金额
function formatMoney(value) {
  if (value == null || isNaN(value)) return ' 0.00'
  return ` ${Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// 计算大佬持仓占比
function getBossRatio(amount) {
  if (fundStore.bossCurrentTotal === 0) return '0.00'
  return ((amount / fundStore.bossCurrentTotal) * 100).toFixed(2)
}

// 计算我应投入的金额
function getShouldInvest(bossAmount) {
  if (fundStore.bossTotal === 0 || fundStore.bossCurrentTotal === 0) return 0
  const ratio = fundStore.myTotal / fundStore.bossTotal
  return bossAmount * ratio
}

// 计算我的投入占比
function getMyRatio(myAmount) {
  if (fundStore.myTotal === 0) return '0.00'
  return ((myAmount / fundStore.myTotal) * 100).toFixed(2)
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
  formData.name = record.name
  formData.code = record.code
  formData.bossAmount = record.bossAmount
  formData.myActualAmount = record.myActualAmount
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
  formData.name = ''
  formData.code = ''
  formData.bossAmount = null
  formData.myActualAmount = 0
}

// 弹窗确认
async function handleModalOk() {
  try {
    await formRef.value.validate()
    saving.value = true

    const data = {
      name: formData.name,
      code: formData.code,
      bossAmount: formData.bossAmount,
      myActualAmount: formData.myActualAmount || 0,
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
</style>
