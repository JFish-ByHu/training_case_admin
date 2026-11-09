<script setup lang="ts">
import { reactive, ref } from 'vue'
import LoginAnimation from './components/LoginAnimation.vue'

const form = reactive({ username: '', password: '' })
const rememberPassword = ref(false)
</script>

<template>
  <main class="login-page">
    <section class="login-visual" aria-label="CRM 平台介绍">
      <LoginAnimation background-color="#409eff" />
    </section>

    <section class="login-panel" aria-labelledby="login-title">
      <header class="login-header">
        <p class="product-name">Admin Demo</p>
        <h2 id="login-title">欢迎登录</h2>
      </header>

      <ElForm :model="form" label-position="top" @submit.prevent>
        <ElFormItem prop="username">
          <ElInput
            v-model="form.username"
            aria-label="用户名"
            autocomplete="username"
            placeholder="请输入用户名"
            size="large"
          />
        </ElFormItem>

        <ElFormItem prop="password">
          <ElInput
            v-model="form.password"
            aria-label="密码"
            autocomplete="current-password"
            placeholder="请输入密码"
            show-password
            size="large"
            type="password"
          />
        </ElFormItem>

        <div class="form-options">
          <ElCheckbox v-model="rememberPassword">记住密码</ElCheckbox>
          <ElButton link type="primary">忘记密码</ElButton>
        </div>

        <ElButton class="submit-button" native-type="submit" size="large" type="primary">
          登录
        </ElButton>
      </ElForm>
    </section>
  </main>
</template>

<style scoped>
.login-page {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  min-height: 100dvh;
  background: var(--el-bg-color-page, #f2f3f5);
}

.login-visual {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  min-height: 100dvh;
  padding: clamp(32px, 6vw, 72px);
  overflow: hidden;
  background: #edf6ff;
}

.login-visual::after {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgb(4 59 74 / 30%),
    rgb(4 59 74 / 8%) 58%,
    rgb(4 59 74 / 18%)
  );
  content: '';
  pointer-events: none;
}

.visual-copy {
  position: relative;
  z-index: 1;
  max-width: 420px;
  color: #fff;
  text-shadow: 0 1px 2px rgb(0 45 61 / 20%);
}

.visual-kicker,
.product-name {
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
}

.visual-kicker {
  margin-bottom: 16px;
}

.product-name {
  color: var(--el-color-primary, #409eff);
}

.visual-copy h1 {
  margin-bottom: 12px;
  font-size: clamp(28px, 3vw, 42px);
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.03em;
}

.visual-copy p:last-child {
  max-width: 360px;
  color: rgb(255 255 255 / 86%);
  font-size: 15px;
  line-height: 1.7;
}

.login-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px clamp(24px, 6vw, 96px);
  background-color: #fff;
}

.login-panel > * {
  width: min(100%, 400px);
}

.login-header {
  margin-bottom: 28px;
}

.product-name {
  margin-bottom: 20px;
}

.login-header h2 {
  margin-bottom: 8px;
  color: var(--el-text-color-primary, #303133);
  font-size: 28px;
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: -0.02em;
}

.login-header p:last-child,
.login-hint {
  color: var(--el-text-color-regular, #606266);
  font-size: 14px;
}

:deep(.el-form-item) {
  margin-bottom: 24px;
}

.submit-button {
  width: 100%;
  min-height: 44px;
  margin-top: 4px;
  border-radius: 8px;
  font-weight: 500;
}

.submit-button {
  border-color: var(--el-color-primary, #409eff);
  background: var(--el-color-primary, #409eff);
}

.submit-button:hover,
.submit-button:focus-visible {
  border-color: var(--el-color-primary-dark-2, #337ecc);
  background: var(--el-color-primary-dark-2, #337ecc);
}

.form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.form-options :deep(.el-checkbox) {
  margin-right: 0;
}

.form-options :deep(.el-button) {
  min-height: 32px;
  padding: 4px 0;
  font-size: 14px;
}

.login-hint {
  margin-top: 20px;
  text-align: center;
}

@media (max-width: 768px) {
  .login-page {
    display: block;
  }

  .login-visual {
    min-height: 220px;
    padding: 32px 24px;
    background-position: center 38%;
  }

  .visual-copy h1 {
    font-size: 28px;
  }

  .visual-copy p:last-child {
    display: none;
  }

  .login-panel {
    min-height: calc(100dvh - 220px);
    padding: 24px 16px 40px;
  }
}
</style>
