<template>
  <el-drawer v-model="drawerVisible" size="60%" @close="handleClose"
    :show-close="false" :close-on-click-modal="true" class="custom-drawer">
    <template #header>
      <div class="custom-header">
        <h2 class="custom-title">{{ props.defaultName }}的评论区</h2>
      </div>
    </template>
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
                <span class="comment-author">{{ maskIp(comment.clientIp) }}</span>
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
          <!-- 图片预览区域 -->
          <div v-if="form.images && form.images.length > 0" class="image-preview-container">
            <div v-for="(image, index) in form.images" :key="index" class="image-preview-item">
              <img :src="image.url" :alt="`预览图片${index + 1}`" class="preview-image" />
              <button class="remove-image-btn" @click="removeImage(index)">×</button>
            </div>
          </div>
          
          <div class="textarea-container">
            <textarea v-model="form.remark" :placeholder="isInstalled ? '请输入评论内容' : '请先安装才能评论'"
              :disabled="!isInstalled || hasCommented" :rows="4" style="width: 100%;" @input="handleInput"></textarea>
            <div class="word-count" :class="{ 'text-red': currentWordCount >= 300 }">{{ currentWordCount }}/300</div>
          </div>
          
          <!-- 工具栏 -->
          <div class="input-toolbar">
            <div class="toolbar-left">
              <input ref="imageInput" type="file" accept="image/*" multiple style="display: none;" @change="handleImageUpload" />
              <!-- 暂时隐藏添加图片按钮 -->
              <!-- <el-button size="small" type="info" :icon="Picture" @click="triggerImageUpload" 
                :disabled="!isInstalled || hasCommented">
                添加图片
              </el-button> -->
            </div>
            <el-button type="primary" class="submit-btn" :loading="loading" @click="submitComment"
              :disabled="!isInstalled || hasCommented || (!form.remark.trim() && (!form.images || form.images.length === 0)) || currentWordCount > 300 || (form.images && form.images.length > 3)">
              {{ hasCommented ? '已评论' : (loading ? '提交中 ...' : '提交') }}
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </el-drawer>
</template>
<script setup lang="ts">
import { reactive, ref, onMounted, computed, watch, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Picture } from '@element-plus/icons-vue'
import { getAppCommentList, saveAppComment } from '@/api';
import { commentItem } from '@/interface';
import { useSystemConfigStore } from '@/store/systemConfig';
import { useInstalledItemsStore } from '@/store/installedItems';
import { logger } from '@/util/logger';

// 添加IP地址打码函数
const maskIp = (ip: string): string => {
  const parts = ip.split('.');
  // 只处理标准IPv4地址格式
  if (parts.length === 4) {
    return `${parts[0]}.**.${parts[3]}`;
  }
  return ip;
};

// 格式化时间
const formatTime = (time: string) => {
  return new Date(time).toLocaleString();
}

// 计算当前字数
const currentWordCount = computed(() => {
  // 按中文字符计算，每个中文/英文/数字/符号均计为1个字符
  return form.remark.length
})

const props = defineProps({
  drawer: { type: Boolean, default: false },
  defaultName: { type: String, default: '评论' },
  appId: { type: String, default: '' },
})

const emit = defineEmits<{ (e: 'update:drawer', val: boolean): void }>()

const loading = ref(false);
const comments = ref<commentItem[]>([]);
const isInstalled = ref(false);
const hasCommented = ref(false);
const loadingComments = ref(false);
const form = reactive({ 
  remark: '',
  images: [] as Array<{ url: string; file: File; base64: string }>
});
const systemConfigStore = useSystemConfigStore();
const installedItemsStore = useInstalledItemsStore();
const imageInput = ref<HTMLInputElement>();

// 创建本地的响应式变量来处理drawer状态
const drawerVisible = ref(false);

// 处理drawer关闭事件
const handleClose = () => {
  drawerVisible.value = false;
  emit('update:drawer', false);
};

// 检查应用安装状态 - 直接从store获取
const checkAppInstallation = () => {
  try {
    if (installedItemsStore.installedItemList && installedItemsStore.installedItemList.length > 0) {
      isInstalled.value = installedItemsStore.installedItemList.some(
        (item: { appId: string }) => item.appId === props.appId
      );
    } else {
      isInstalled.value = false;
    }
  } catch (error) {
    ElMessage.error('检查安装状态失败')
    logger.error('检查安装状态失败', error)
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
    logger.error('获取评论失败', error)
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

// 触发图片上传
const triggerImageUpload = () => {
  imageInput.value?.click();
};

// 将文件转换为base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// 处理图片上传
const handleImageUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  
  if (!files || files.length === 0) return;
  
  // 限制图片数量为3张
  if (form.images.length + files.length > 3) {
    ElMessage.warning('最多只能上传3张图片');
    return;
  }
  
  // 处理每个文件
  for (const file of Array.from(files)) {
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      ElMessage.warning('只能上传图片文件');
      continue;
    }
    
    // 检查文件大小 (2MB)
    if (file.size > 2 * 1024 * 1024) {
      ElMessage.warning('图片大小不能超过2MB');
      continue;
    }
    
    try {
      // 转换为base64
      const base64 = await fileToBase64(file);
      
      // 创建预览URL
      const url = URL.createObjectURL(file);
      
      // 添加到图片列表
      form.images.push({ url, file, base64 });
    } catch (error) {
      ElMessage.error('图片转换失败');
      logger.error('Base64转换错误:', error);
    }
  }
  
  // 清空input
  target.value = '';
};

// 移除图片
const removeImage = (index: number) => {
  const image = form.images[index];
  URL.revokeObjectURL(image.url); // 释放内存
  form.images.splice(index, 1);
};

// 提交评论
const submitComment = async () => {
  if (!form.remark.trim() && (!form.images || form.images.length === 0)) {
    ElMessage.warning('请输入评论内容或添加图片')
    return
  }
  // 字数限制检查
  if (form.remark.length > 300) {
    ElMessage.warning('评论字数不能超过300字')
    return
  }
  loading.value = true
  try {
    // 从store中获取版本信息，而不是从localStorage
    let version = '';
    if (installedItemsStore.installedItemList && installedItemsStore.installedItemList.length > 0) {
      const installedApp = installedItemsStore.installedItemList.find(
        (item: any) => item.appId === props.appId
      );
      if (installedApp) {
        version = installedApp.version;
      }
    }
    
    // 准备提交数据
    const submitData: any = {
      appId: props.appId,
      visit: systemConfigStore.getClientIp,
      remark: form.remark,
      version: version
    };
    
    // 如果有图片，添加base64图片数据
    if (form.images && form.images.length > 0) {
      submitData.images = form.images.map(img => ({
        name: img.file.name,
        size: img.file.size,
        type: img.file.type,
        base64: img.base64
      }));
    }
    
    await saveAppComment(submitData);
    ElMessage.success('评论发布成功')
    
    // 清理表单
    form.remark = ''
    form.images.forEach(img => URL.revokeObjectURL(img.url));
    form.images = []
    hasCommented.value = true
    await fetchComments() // 重新获取评论列表
  } catch (error) {
    ElMessage.error('发布评论失败')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  // 初始化时检查安装状态
  checkAppInstallation();
  await fetchComments();
  
  // 动态设置 drawer header 的样式
  setTimeout(() => {
    const header = document.querySelector('.el-drawer__header') as HTMLElement;
    if (header) {
      header.style.setProperty('margin-bottom', '0px', 'important');
    }
  }, 100);
})

// 监听props.drawer的变化，同步到本地状态
watch(
  () => props.drawer,
  (newValue) => {
    drawerVisible.value = newValue;
    
    // 当 drawer 打开时，设置 header 样式
    if (newValue) {
      setTimeout(() => {
        const header = document.querySelector('.el-drawer__header') as HTMLElement;
        if (header) {
          header.style.setProperty('margin-bottom', '0px', 'important');
        }
      }, 50);
    }
  },
  { immediate: true }
)

// 监听已安装应用列表的变化，实时更新安装状态
watch(
  () => installedItemsStore.installedItemList,
  () => {
    checkAppInstallation();
  },
  { deep: true, immediate: true }
)
</script>
<style scoped>
/* 保留 CSS 样式作为备用方案 */
.el-drawer .el-drawer__header {
  margin-bottom: 0 !important;
}

/* 自定义标题样式 */
.custom-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 10px 20px;
  margin: -20px -20px 0px -20px;
  border-bottom: 2px solid #e8e8e8;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 30px;
}

.custom-title {
  font-size: 20px;
  font-weight: 700;
  text-align: center;
  margin: 0;
  padding: 0;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  letter-spacing: 1px;
  width: 100%;
}

.demo-drawer__content {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 8px;
  background-color: #f5f7fa;
  /* 整个评论区背景色 */
}

.drawer-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  background-color: #ffffff;
  /* 评论列表容器背景 */
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.comments-container {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  /* 添加滚动条样式 */
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
  max-height: calc(100vh - 200px);
}

.comments-container:hover {
  scrollbar-color: #ccc transparent;
}

/* WebKit浏览器滚动条样式 */
.comments-container::-webkit-scrollbar {
  width: 6px;
}

.comments-container::-webkit-scrollbar-thumb {
  background-color: transparent;
  border-radius: 3px;
}

.comments-container:hover::-webkit-scrollbar-thumb {
  background-color: #ccc;
}

.comment-item {
  padding: 15px;
  border-bottom: 1px solid #eee;
  background-color: #f9f9f9;
  /* 评论项背景色 */
  border-radius: 8px;
  margin-bottom: 15px;
  transition: all 0.2s ease;
}

.comment-item:hover {
  background-color: #f0f0f0;
  /* 评论项悬停效果 */
  transform: translateY(-2px);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.08);
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  /* 减小底部间距 */
  color: #666;
  font-size: 12px;
  /* 减小字号 */
}

.comment-item {
  padding: 12px 15px;
  /* 减小内边距 */
  border-bottom: 1px solid #eee;
  background-color: #f9f9f9;
  border-radius: 8px;
  margin-bottom: 15px;
  transition: all 0.2s ease;
}

.comment-item:hover {
  background-color: #f0f0f0;
  /* 评论项悬停效果 */
  transform: translateY(-2px);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.08);
}

.comment-content {
  color: #333;
  line-height: 1.5;
  overflow-wrap: break-word;
  /* 添加这行解决长文本换行问题 */
}

.no-comments,
.loading-state {
  text-align: center;
  padding: 20px;
  color: #666;
}

.comment-input-container {
  position: relative;
  width: 100%;
  max-width: 100%;
  background-color: #ffffff;
  /* 输入框背景 */
  border-radius: 8px;
  padding: 10px;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.05);
  margin: 0 auto;
}

/* 图片预览容器 */
.image-preview-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
  padding: 8px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border: 1px dashed #d9d9d9;
}

.image-preview-item {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #e8e8e8;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-image-btn {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: #ff4d4f;
  color: white;
  border: none;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.remove-image-btn:hover {
  background-color: #ff7875;
}

/* 文本输入容器 */
.textarea-container {
  position: relative;
  width: 100%;
}

.comment-input-container textarea {
  resize: none;
  /* 禁用垂直调整 */
  height: 100px;
  /* 固定高度 */
  padding: 10px 10px 30px;
  /* 底部留出字数统计空间 */
  box-sizing: border-box;
}

/* 工具栏样式 */
.input-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: absolute;
  bottom: 10px;
  left: 10px;
  right: 10px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.word-count {
  position: absolute;
  left: 10px;
  bottom: 5px;
  color: #666;
  font-size: 12px;
}

/* 超过字数限制时的样式 */
.text-red {
  color: #ff4d4f;
  font-weight: bold;
}

.submit-btn {
  width: 80px;
}

.demo-drawer__footer {
  padding: 16px;
  margin-top: 8px;
  border-top: 1px solid #eee;
  background: #fff;
  width: 100%;
  box-sizing: border-box;
  border-radius: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>