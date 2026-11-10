<script setup lang="ts">
/** 控制台演示页，当前指标与动态均为静态示例数据。 */
const metrics = [
  { label: '用户总数', value: '128', change: '较上周 +12' },
  { label: '活跃用户', value: '96', change: '最近 7 天' },
  { label: '管理员', value: '4', change: '账号管理' },
  { label: '今日新增', value: '7', change: '较昨日 +2' }
]

const activities = [
  { action: '新增用户', account: 'student_021', time: '今天 09:42' },
  { action: '更新资料', account: 'student_018', time: '今天 08:15' },
  { action: '新增用户', account: 'student_020', time: '昨天 16:30' }
]
</script>

<template>
  <div class="dashboard">
    <div class="page-heading">
      <div>
        <h1>控制台</h1>
        <p>账号与用户概览</p>
      </div>
      <span class="sample-label">演示数据</span>
    </div>

    <section class="overview" aria-label="数据概览">
      <article v-for="metric in metrics" :key="metric.label" class="metric">
        <p>{{ metric.label }}</p>
        <strong>{{ metric.value }}</strong>
        <span>{{ metric.change }}</span>
      </article>
    </section>

    <section class="activity" aria-labelledby="activity-title">
      <div class="section-heading">
        <h2 id="activity-title">最近动态</h2>
        <RouterLink to="/users">用户管理</RouterLink>
      </div>
      <div class="activity-list">
        <div v-for="item in activities" :key="item.account" class="activity-row">
          <span class="activity-dot" aria-hidden="true"></span>
          <span class="activity-action">{{ item.action }}</span>
          <span class="activity-account">{{ item.account }}</span>
          <time>{{ item.time }}</time>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.dashboard {
  width: 100%;
}

.page-heading,
.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.page-heading {
  margin-bottom: 24px;
}

h1 {
  color: var(--el-text-color-primary);
  font-size: 24px;
  font-weight: 650;
}

.page-heading p {
  margin-top: 6px;
  color: var(--el-text-color-regular);
  font-size: 14px;
}

.sample-label {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  white-space: nowrap;
}

.overview {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.metric {
  display: flex;
  flex-direction: column;
  min-height: 146px;
  padding: 20px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  background: var(--el-bg-color);
}

.metric p {
  color: var(--el-text-color-regular);
  font-size: 14px;
}

.metric strong {
  margin-top: 14px;
  color: var(--el-text-color-primary);
  font-size: 29px;
  font-weight: 650;
  line-height: 1;
}

.metric span {
  margin-top: auto;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.activity {
  margin-top: 36px;
}

.section-heading {
  margin-bottom: 16px;
}

h2 {
  color: var(--el-text-color-primary);
  font-size: 18px;
  font-weight: 600;
}

.section-heading a {
  color: var(--el-color-primary);
  font-size: 14px;
  text-decoration: none;
}

.section-heading a:hover {
  text-decoration: underline;
}

.activity-list {
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  background: var(--el-bg-color);
}

.activity-row {
  display: grid;
  grid-template-columns: 8px 92px minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  min-height: 58px;
  padding: 0 20px;
  color: var(--el-text-color-primary);
  font-size: 14px;
}

.activity-row + .activity-row {
  border-top: 1px solid var(--el-border-color-lighter);
}

.activity-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--el-color-primary);
}

.activity-account {
  overflow: hidden;
  color: var(--el-text-color-regular);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.activity-row time {
  color: var(--el-text-color-secondary);
  font-size: 13px;
  white-space: nowrap;
}

@media (max-width: 1100px) {
  .overview {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 520px) {
  .overview {
    gap: 10px;
  }

  .metric {
    min-height: 130px;
    padding: 16px;
  }

  .activity-row {
    grid-template-columns: 8px 76px minmax(0, 1fr);
    gap: 10px;
    padding: 12px;
  }

  .activity-row time {
    grid-column: 3;
    font-size: 12px;
  }
}
</style>
