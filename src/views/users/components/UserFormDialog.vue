<script setup lang="ts">
/** 新增和编辑用户资料的弹窗。 */
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { createUser, updateUser } from '@/api/users'
import type { CreateUserInput, UserRecord } from '@/api/types/users'

const props = defineProps<{ user?: UserRecord | null }>()
const visible = defineModel<boolean>({ required: true })
const emit = defineEmits<{ saved: [] }>()
const formRef = ref<FormInstance>()
const saving = ref(false)
const isEdit = computed(() => Boolean(props.user))
const form = reactive<CreateUserInput>({
  username: '', nickname: '', phone: '', bio: '', role: 'USER', status: 'ENABLED'
})

const rules: FormRules<CreateUserInput> = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { pattern: /^[a-z0-9_]{3,32}$/, message: '请输入 3-32 位小写字母、数字或下划线', trigger: 'blur' }
  ],
  nickname: [
    { required: true, whitespace: true, message: '请输入昵称', trigger: 'blur' },
    { max: 50, message: '昵称不能超过 50 个字符', trigger: 'blur' }
  ],
  phone: [{ max: 32, message: '电话不能超过 32 个字符', trigger: 'blur' }],
  bio: [{ max: 500, message: '简介不能超过 500 个字符', trigger: 'blur' }]
}

watch(visible, opened => {
  if (!opened) return
  Object.assign(form, {
    username: props.user?.username ?? '',
    nickname: props.user?.nickname ?? '',
    phone: props.user?.phone ?? '',
    bio: props.user?.bio ?? '',
    role: props.user?.role ?? 'USER',
    status: props.user?.status ?? 'ENABLED'
  })
  formRef.value?.clearValidate()
})

/** 校验表单并调用对应新增或更新接口，成功后通知父页面刷新。 */
const saveUser = async () => {
  if (saving.value) return
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  try {
    if (props.user) {
      await updateUser({
        id: props.user.id,
        nickname: form.nickname.trim(),
        phone: form.phone.trim(),
        bio: form.bio.trim(),
        role: props.user.role,
        status: form.status
      })
    } else {
      await createUser({
        username: form.username.trim(),
        nickname: form.nickname.trim(),
        phone: form.phone.trim(),
        bio: form.bio.trim(),
        role: 'USER',
        status: form.status
      })
    }
    visible.value = false
    ElMessage.success(props.user ? '用户已更新' : '用户已新增')
    emit('saved')
  } catch {
    // 请求器统一显示接口错误，保留表单供修改。
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <ElDialog
    v-model="visible"
    :title="isEdit ? '编辑用户' : '新增用户'"
    width="620px"
    :style="{ maxWidth: 'calc(100vw - 32px)' }"
    :close-on-click-modal="false"
    :close-on-press-escape="!saving"
    :show-close="!saving"
    destroy-on-close
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="saveUser">
      <div class="form-row">
        <ElFormItem label="用户名" prop="username">
          <ElInput v-model="form.username" :disabled="isEdit" maxlength="32" autocomplete="off" />
        </ElFormItem>
        <ElFormItem label="昵称" prop="nickname">
          <ElInput v-model="form.nickname" maxlength="50" />
        </ElFormItem>
      </div>
      <div class="form-row">
        <ElFormItem label="电话" prop="phone">
          <ElInput v-model="form.phone" maxlength="32" />
        </ElFormItem>
      </div>
      <div class="form-row">
        <ElFormItem label="角色">
          <div class="role-value">{{ form.role === 'ADMIN' ? '管理员' : '普通用户' }}</div>
        </ElFormItem>
        <ElFormItem label="状态" prop="status">
          <div class="status-control">
            <ElSwitch v-model="form.status" active-value="ENABLED" inactive-value="DISABLED" />
            <span>{{ form.status === 'ENABLED' ? '启用' : '停用' }}</span>
          </div>
        </ElFormItem>
      </div>
      <ElFormItem label="简介" prop="bio">
        <ElInput v-model="form.bio" type="textarea" :rows="3" maxlength="500" show-word-limit />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton :disabled="saving" @click="visible = false">取消</ElButton>
      <ElButton type="primary" :loading="saving" @click="saveUser">保存</ElButton>
    </template>
  </ElDialog>
</template>

<style scoped>
.form-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.role-value,
.status-control {
  display: flex;
  align-items: center;
  min-height: 32px;
  color: var(--el-text-color-regular);
  font-size: 14px;
}
.status-control { gap: 12px; }
@media (max-width: 480px) {
  .form-row { grid-template-columns: 1fr; gap: 0; }
}
</style>
