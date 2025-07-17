<template>
    <el-drawer v-model="props.drawer" :title="`${props.defaultName}的评论区`" size="60%" @close="emit('update:drawer', false)">
        <!-- <div style="background-color: cadetblue;">
            <el-button @click="innerDrawer = true">Click me!</el-button>
            <el-drawer v-model="innerDrawer" title="I'm inner Drawer" :append-to-body="true"
                :before-close="handleClose">
                <p>_(:зゝ∠)_</p>
            </el-drawer>
        </div> -->
        <div class="demo-drawer__content">
            <el-form :model="form">
                <el-form-item label="Name" :label-width="formLabelWidth">
                <el-input v-model="form.name" autocomplete="off" />
                </el-form-item>
                <el-form-item label="Area" :label-width="formLabelWidth">
                <el-select v-model="form.region" placeholder="Please select activity area">
                    <el-option label="Area1" value="shanghai" />
                    <el-option label="Area2" value="beijing" />
                </el-select>
                </el-form-item>
            </el-form>
            <div class="demo-drawer__footer">
                <textarea style="width: 100%;" v-model="form.content" placeholder="请输入评论内容"></textarea>
                <el-button @click="cancelForm">取消</el-button>
                <el-button type="primary" :loading="loading" @click="onClick">
                {{ loading ? '提交中 ...' : '提交' }}
                </el-button>
            </div>
        </div>
    </el-drawer>
</template>
<script setup lang="ts">
import { reactive, ref } from 'vue'
const props = defineProps({
    drawer: {
        type: Boolean,
        default: false
    },
    defaultName: {
        type: String,
        default: '评论'
    },
})

const emit = defineEmits<{(e: 'update:drawer', val: boolean): void}>()

const formLabelWidth = '80px'
let timer: string | number | NodeJS.Timeout | undefined

const dialog = ref(false)
const loading = ref(false)

const form = reactive({
  name: '',
  region: '',
  date1: '',
  date2: '',
  delivery: false,
  type: [],
  resource: '',
  desc: '',
  content: '',
})

const onClick = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    dialog.value = false
  }, 400)
}

const handleClose = (done: () => void) => {
  if (loading.value) {
    return
  }
  ElMessageBox.confirm('Do you want to submit?')
    .then(() => {
      loading.value = true
      timer = setTimeout(() => {
        done()
        // 动画关闭需要一定的时间
        setTimeout(() => {
          loading.value = false
        }, 400)
      }, 2000)
    })
    .catch(() => {
      // catch error
    })
}

const cancelForm = () => {
  loading.value = false
  dialog.value = false
  clearTimeout(timer)
}

</script>