<template>
    <el-drawer v-model="props.drawer" :title="`${props.defaultName}的评论区`" size="60%" @close="emit('update:drawer', false)">
        <div class="demo-drawer__content">
          <!-- 使用flex容器实现固定底部效果 -->
          <div class="drawer-container">
            <!-- 评论列表区域(可滚动) -->
            <div class="comments-container">
                <div v-if="!isInstalled" class="install-tip">请先安装应用才能评论</div>
                <div v-if="loadingComments" class="loading-state">加载评论中...</div>
                <div v-else-if="comments.length === 0" class="no-comments">暂无评论</div>
                <div v-else class="comments-list">
                    <div v-for="comment in comments" :key="comment.id" class="comment-item">
                        <div class="comment-header">
                            <span class="comment-author">{{ comment.author }}</span>
                            <span class="comment-time">{{ formatTime(comment.createTime) }}</span>
                        </div>
                        <div class="comment-content">{{ comment.content }}</div>
                    </div>
                </div>
            </div>
          </div> 
          <!-- 评论输入区域 -->
          <div class="demo-drawer__footer">
            <div class="comment-input-container">
              <textarea  v-model="form.content" placeholder="请输入评论内容" :disabled="!isInstalled || hasCommented"
                  :rows="4" style="width: 100%;"></textarea>
              <el-button type="primary" class="submit-btn" :loading="loading" @click="submitComment"
                  :disabled="!isInstalled || hasCommented || !form.content.trim()">
                  {{ hasCommented ? '已评论' : (loading ? '提交中 ...' : '提交') }}
              </el-button>
            </div>
          </div>
        </div>
    </el-drawer>
</template>
<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { ipcRenderer } from 'electron'
import { ElMessage} from 'element-plus'

const props = defineProps({
    drawer: { type: Boolean, default: false },
    defaultName: { type: String, default: '评论' },
    appId: { type: String, default: '' },
})

const emit = defineEmits<{(e: 'update:drawer', val: boolean): void}>()

const loading = ref(false);
const comments = ref<{
  id: number
  author: string
  content: string
  createTime: string
}[]>([]);
const isInstalled = ref(false);
const hasCommented = ref(false);
const loadingComments = ref(false);

// 格式化时间
const formatTime = (time: string) => {
  return new Date(time).toLocaleString();
}

// 检查应用安装状态
const checkAppInstallation = async () => {
  try {
    const installedItems = localStorage.getItem('installedItems');
    if (installedItems) {
      const installedApps = JSON.parse(installedItems);
      isInstalled.value = installedApps['installedItemList'].some((item: { appId: string }) => item.appId === props.appId);
    }
  } catch (error) {
    ElMessage.error('检查安装状态失败')
    console.error(error)
  }
}

// 获取评论列表
const fetchComments = async () => {
  if (!props.appId) return
  // 加载状态中
  loadingComments.value = true
  try {
    // const result = await ipcRenderer.invoke('get-comments', { appId: props.appId })
    // comments.value = result.comments || []
    // hasCommented.value = result.hasCommented || false
    comments.value = []
    hasCommented.value = false
  } catch (error) {
    ElMessage.error('获取评论失败')
    console.error(error)
  } finally {
    loadingComments.value = false
  }
}

// 提交评论
const submitComment = async () => {
  if (!form.content.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }

  loading.value = true
  try {
    await ipcRenderer.invoke('submit-comment', { appId: props.appId, content: form.content })
    ElMessage.success('评论发布成功')
    form.content = ''
    hasCommented.value = true
    await fetchComments() // 重新获取评论列表
  } catch (error) {
    ElMessage.error('发布评论失败')
  } finally {
    loading.value = false
  }
}

const form = reactive({
  content: '',
})

onMounted(async () => {
  await checkAppInstallation()
  if (isInstalled.value) {
    await fetchComments()
  }
})
</script>
<style scoped>
.demo-drawer__content {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.drawer-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.comments-container {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  margin-bottom: 20px;
}

.comment-item {
  padding: 15px 0;
  border-bottom: 1px solid #eee;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  color: #666;
}

.comment-content {
  color: #333;
  line-height: 1.5;
}

.install-tip,
.no-comments,
.loading-state {
  text-align: center;
  padding: 20px;
  color: #666;
}

.comment-input-container {
  position: relative;
  width: 100%;
}

.comment-input-container textarea {
  resize: none; /* 禁用垂直调整 */
  height: 120px; /* 固定高度 */
  padding: 10px 10px 40px; /* 底部留出按钮空间 */
  box-sizing: border-box;
}

.submit-btn {
  position: absolute;
  right: 10px;
  bottom: 10px;
  width: 80px;
}

.demo-drawer__footer {
  padding: 16px;
  border-top: 1px solid #eee;
  background: #fff;
  width: 100%;
  box-sizing: border-box;
}
</style>