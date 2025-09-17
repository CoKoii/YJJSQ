<template>
  <div class="app-container">
    <div class="app-content">
      <!-- 总览表单 -->
      <SummaryForm />

      <!-- 持仓明细表格 -->
      <HoldingsTable />
    </div>
  </div>
</template>

<script setup>
import SummaryForm from './components/SummaryForm.vue'
import HoldingsTable from './components/HoldingsTable.vue'
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background-color: #f0f2f5;
  padding: 24px;
}

.app-content {
  max-width: 1400px;
  margin: 0 auto;
}

/* 全局样式覆盖 */
:deep(.ant-card) {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

:deep(.ant-card-head-title) {
  font-size: 18px;
  font-weight: 600;
}

:deep(.ant-table-thead > tr > th) {
  background-color: #fafafa;
  font-weight: 600;
  border-bottom: 2px solid #f0f0f0;
}

:deep(.ant-form-item-label > label) {
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .app-container {
    padding: 16px;
  }

  .app-header h1 {
    font-size: 24px;
  }

  .app-header p {
    font-size: 14px;
  }

  :deep(.ant-table) {
    font-size: 12px;
  }

  :deep(.ant-col) {
    margin-bottom: 16px;
  }
}

@media (max-width: 576px) {
  .app-container {
    padding: 12px;
  }

  :deep(.ant-card-body) {
    padding: 16px;
  }
}
</style>
