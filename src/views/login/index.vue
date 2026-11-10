<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { fetchCaptcha, login, type CaptchaResult, type LoginResult } from '@/api/auth'
import { useAuthStore } from '@/stores'
import LoginAnimation from './components/LoginAnimation.vue'

const router = useRouter()
const authStore = useAuthStore()
const formRef = ref<FormInstance>()
const form = reactive({ username: '', password: '', captchaCode: '' })
const captcha = ref<CaptchaResult | null>(null)
const captchaLoading = ref(false)
const submitting = ref(false)

const rules: FormRules<typeof form> = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  captchaCode: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { pattern: /^[0-9]{4}$/, message: '请输入4位数字验证码', trigger: 'blur' }
  ]
}

async function loadCaptcha() {
  captcha.value = null
  form.captchaCode = ''
  formRef.value?.clearValidate('captchaCode')
  try {
    captcha.value = await fetchCaptcha()
  } catch {
    // 请求器已经显示错误，保留重新获取入口。
  }
}

async function submitLogin() {
  if (submitting.value) return
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  if (!captcha.value) {
    ElMessage.warning('请先获取验证码')
    return
  }

  submitting.value = true
  let result: LoginResult
  try {
    result = await login({
      username: form.username.trim(),
      password: form.password,
      captchaId: captcha.value.captchaId,
      captchaCode: form.captchaCode
    })
  } catch {
    await loadCaptcha()
    submitting.value = false
    return
  }

  authStore.setToken(result.accessToken)
  authStore.setUser(result.user)
  if (authStore.rememberMe) {
    try {
      await authStore.saveRememberedCredentials(form.username.trim(), form.password)
    } catch {
      authStore.clearRememberedCredentials()
      ElMessage.warning('无法保存登录信息')
    }
  } else {
    authStore.clearRememberedCredentials()
  }
  submitting.value = false
  await router.replace('/dashboard')
  ElMessage.success('登录成功')
}

function changeRememberMe(value: boolean | string | number) {
  if (!value) authStore.clearRememberedCredentials()
}

onMounted(() => {
  void loadCaptcha()
  void authStore.restoreRememberedCredentials().then(credentials => {
    if (credentials && !form.username && !form.password) {
      form.username = credentials.username
      form.password = credentials.password
    }
  })
})
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

      <ElForm
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="submitLogin"
      >
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

        <ElFormItem prop="captchaCode">
          <div class="captcha-row">
            <ElInput
              v-model="form.captchaCode"
              aria-label="验证码"
              autocomplete="off"
              inputmode="numeric"
              maxlength="4"
              placeholder="请输入验证码"
              size="large"
            />
            <ElButton
              class="captcha-display"
              :disabled="submitting"
              :loading="captchaLoading"
              size="large"
              title="刷新验证码"
              type="default"
              @click="loadCaptcha"
            >
              {{ captcha?.captchaCode }}
            </ElButton>
          </div>
        </ElFormItem>

        <div class="form-options">
          <ElCheckbox v-model="authStore.rememberMe" @change="changeRememberMe">记住我</ElCheckbox>
        </div>

        <ElButton
          class="submit-button"
          :loading="submitting"
          native-type="submit"
          size="large"
          type="primary"
        >
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
  background: var(--el-bg-color-page);
}

.login-visual {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  min-height: 100dvh;
  padding: clamp(32px, 6vw, 72px);
  overflow: hidden;
  background: var(--el-color-primary);
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
  color: var(--el-color-primary);
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
  background-color: var(--el-bg-color);
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
  color: var(--el-text-color-primary);
  font-size: 28px;
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: -0.02em;
}

.login-header p:last-child,
.login-hint {
  color: var(--el-text-color-regular);
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
  border-color: var(--el-color-primary);
  background: var(--el-color-primary);
}

.submit-button:hover,
.submit-button:focus-visible {
  border-color: var(--el-color-primary-dark-2);
  background: var(--el-color-primary-dark-2);
}

.captcha-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.captcha-row :deep(.el-input) {
  min-width: 0;
  flex: 1;
}

.captcha-display {
  width: 116px;
  height: 40px;
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0;
}

.form-options {
  margin-bottom: 24px;
}

.form-options :deep(.el-checkbox) {
  margin-right: 0;
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
