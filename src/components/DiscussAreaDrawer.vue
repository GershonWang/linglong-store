<template>
    <el-drawer v-model="props.drawer" :title="`${props.defaultName}的评论区`" size="60%" @close="emit('update:drawer', false)">
        <div class="demo-drawer__content">
          <!-- 使用flex容器实现固定底部效果 -->
          <div class="drawer-container">
            <!-- 评论列表区域(可滚动) -->
            <div class="comments-container">
              <div v-if="loadingComments" class="loading-state">加载评论中...</div>
              <div v-else-if="comments.length === 0" class="no-comments">暂无评论</div>
              <div v-else class="comments-list">
                <div v-for="comment in comments" :key="comment.id" class="comment-item">
                  <div class="comment-header">
                    <span class="comment-author">{{ comment.clientIp }}</span>
                    <span class="comment-time">{{ formatTime(comment.createTime) }}</span>
                  </div>
                  <div class="comment-content">{{ comment.remark }}</div>
                </div>
              </div>
            </div>
          </div> 
          <!-- 评论输入区域 -->
          <div class="demo-drawer__footer">
            <div class="comment-input-container">
              <textarea  v-model="form.remark" :placeholder="isInstalled ? '请输入评论内容' : '请先安装才能评论'" :disabled="!isInstalled || hasCommented"
                  :rows="4" style="width: 100%;" @input="handleInput"></textarea>
              <div class="word-count" :class="{ 'text-red': currentWordCount >= 300 }">{{ currentWordCount }}/300</div>
              <el-button type="primary" class="submit-btn" :loading="loading" @click="submitComment"
                  :disabled="!isInstalled || hasCommented || !form.remark.trim() || currentWordCount > 300">
                  {{ hasCommented ? '已评论' : (loading ? '提交中 ...' : '提交') }}
              </el-button>
            </div>
          </div>
        </div>
    </el-drawer>
</template>
<script setup lang="ts">
import { reactive, ref, onMounted, computed } from 'vue'
import { ElMessage} from 'element-plus'
import { getAppCommentList, saveAppComment } from '@/api';
import { commentItem } from '@/interface';
import { useSystemConfigStore } from '@/store/systemConfig';

const props = defineProps({
    drawer: { type: Boolean, default: false },
    defaultName: { type: String, default: '评论' },
    appId: { type: String, default: '' },
})

const emit = defineEmits<{(e: 'update:drawer', val: boolean): void}>()

const loading = ref(false);
const comments = ref<commentItem[]>([]);
const isInstalled = ref(false);
const hasCommented = ref(false);
const loadingComments = ref(false);
const form = reactive({
  remark: '',
});
const systemConfigStore = useSystemConfigStore();

// 格式化时间
const formatTime = (time: string) => {
  return new Date(time).toLocaleString();
}

// 计算当前字数
const currentWordCount = computed(() => {
  // 按中文字符计算，每个中文/英文/数字/符号均计为1个字符
  return form.remark.length
})

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
    const result = await getAppCommentList({ appId: props.appId });
    comments.value = result.data || [];
    // 检查是否已评论
    hasCommented.value = comments.value.some((item: commentItem) => systemConfigStore.getClientIp === item.clientIp) || false
  } catch (error) {
    ElMessage.error('获取评论失败')
    console.error(error)
  } finally {
    loadingComments.value = false
  }
}

// 处理输入事件，限制最大字数
const handleInput = () => {
  const maxLength = 300
  if (form.remark.length > maxLength) {
    // 截断到最大长度
    form.remark = form.remark.slice(0, maxLength)
    // 显示提示
    ElMessage.warning('评论字数不能超过300字')
  }
}

// 提交评论
const submitComment = async () => {
  if (!form.remark.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }
  // 字数限制检查
  if (form.remark.length > 300) {
    ElMessage.warning('评论字数不能超过300字')
    return
  }
  loading.value = true
  try {
    let version = '';
    const installedItems = localStorage.getItem('installedItems');
    if (installedItems) {
      const installedApps = JSON.parse(installedItems);
      installedApps['installedItemList'].forEach((item: any) => {
        if (item.appId === props.appId) {
          version = item.version;
        }
      })
    }
    await saveAppComment({ 
      appId: props.appId, 
      visit: systemConfigStore.getClientIp, 
      remark: form.remark, 
      version: version 
    });
    ElMessage.success('评论发布成功')
    form.remark = ''
    hasCommented.value = true
    await fetchComments() // 重新获取评论列表
  } catch (error) {
    ElMessage.error('发布评论失败')
  } finally {
    loading.value = false
  }
}

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
  background-color: #f5f7fa; /* 整个评论区背景色 */
}

.drawer-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  background-color: #ffffff; /* 评论列表容器背景 */
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.comments-container {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  margin-bottom: 20px;
  padding: 20px;
}

.comment-item {
  padding: 15px;
  border-bottom: 1px solid #eee;
  background-color: #f9f9f9; /* 评论项背景色 */
  border-radius: 8px;
  margin-bottom: 15px;
  transition: all 0.2s ease;
}

.comment-item:hover {
  background-color: #f0f0f0; /* 评论项悬停效果 */
  transform: translateY(-2px);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.08);
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
  overflow-wrap: break-word; /* 添加这行解决长文本换行问题 */
}

.no-comments,.loading-state {
  text-align: center;
  padding: 20px;
  color: #666;
}

.comment-input-container {
  position: relative;
  width: 100%;
  background-color: #ffffff; /* 输入框背景 */
  border-radius: 8px;
  padding: 10px;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.05);
}

.comment-input-container textarea {
  resize: none; /* 禁用垂直调整 */
  height: 120px; /* 固定高度 */
  padding: 10px 10px 40px; /* 底部留出按钮空间 */
  box-sizing: border-box;
}

.word-count {
  position: absolute;
  left: 10px;
  bottom: -2px;
  color: #666;
  font-size: 12px;
}

/* 超过字数限制时的样式 */
.text-red {
  color: #ff4d4f;
  font-weight: bold;
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