<template>
  <div style="height: calc(100vh - 88px);">
    <div>
      <li><a class="title">基础设置</a></li>
      <div style="margin-left: 30px;">
        <el-tooltip placement="top" effect="dark" content="是否启动App自动检测商店版本(默认是启动)">
          <el-checkbox v-model="autoCheckUpdate" size="large"
            @change="systemConfigStore.changeAutoCheckUpdate(autoCheckUpdate)">
            启动App自动检测商店版本
          </el-checkbox>
        </el-tooltip>
        <el-tooltip placement="top" effect="dark" content="点击右上角退出程序时弹框是否显示(默认记住上次选择)">
          <el-checkbox v-model="rememberCloseDialog" size="large" style="margin-left: 15px;"
            @change="systemConfigStore.changeRememberCloseDialog(rememberCloseDialog)">
            关闭窗口确认弹窗
          </el-checkbox>
        </el-tooltip>
      </div>
      <hr>
    </div>
    <div v-if="compareVersions(systemConfigStore.llVersion, '2.7.0') >= 0">
      <li><a class="title">仓库源设置</a></li>
      <div style="margin-left: 30px;">
        <el-select v-model="defaultRepo" placeholder="选择仓库源" style="width: 160px">
          <el-option v-for="item in sourceUrl" :key="item.name" :label="item.name" :value="item.url" />
        </el-select>
      </div>
      <hr>
    </div>
    <div>
      <li><a class="title">更新程序</a></li>
      <div style="margin-left: 30px;">
        <el-tooltip placement="top" effect="dark" content="是否显示应用更新提醒(其中包括系统更新提醒和左侧更新菜单的右上角数量角标提醒)">
          <el-checkbox v-model="isShowUpdateTip" size="large"
            @change="systemConfigStore.changeIsShowUpdateTip(isShowUpdateTip)">
            启动应用更新提醒
          </el-checkbox>
        </el-tooltip>
      </div>
      <hr>
    </div>
    <div>
      <li><a class="title">卸载程序</a></li>
      <div style="margin-left: 30px;">
        <el-checkbox v-model="isShowBaseService" size="large"
          @change="systemConfigStore.changeIsShowBaseService(isShowBaseService)">
          显示基础运行服务
        </el-checkbox>
      </div>
      <hr>
    </div>
    <div v-if="compareVersions(systemConfigStore.llVersion, VERSION_THRESHOLDS.UPDATE_LIST_SUPPORT) >= 0">
      <li><a class="title">清除缓存</a></li>
      <div style="margin-left: 30px;">
        <el-button type="success" @click="pruneLinyaps" style="height: 24px;" :disabled="clearBtnStatus">清除废弃基础服务</el-button>
      </div>
      <hr>
    </div>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { ipcRenderer } from "electron";
import { ElNotification } from 'element-plus'
import { compareVersions } from '@/util/checkVersion';
import { VERSION_THRESHOLDS } from '@/constants';
import { useSystemConfigStore } from "@/store/systemConfig";

const systemConfigStore = useSystemConfigStore();

// 自动检测更新
let autoCheckUpdate = ref(true);
// 是否显示应用更新提醒
let isShowUpdateTip = ref(true);
// 默认玲珑仓库对象
let defaultRepo = ref('');
// 仓库源地址
let sourceUrl = ref<Record<string, any>>();
// 是否显示基础运行服务
let isShowBaseService = ref(false);
// 清除按钮状态
let clearBtnStatus = ref(false);
// 退出确认弹窗
let rememberCloseDialog = ref(false);

// 清除无用组件
const pruneLinyaps = () => {
  clearBtnStatus.value = true;  // 禁用按钮
  ipcRenderer.send('linyaps-prune');
  ipcRenderer.once('linyaps-prune-result', (_event, res) => {
    const { stdout, stderr, error } = res;
    clearBtnStatus.value = false;  // 恢复按钮状态
    if (error || stderr) {
      ElNotification({ title: '操作失败!', type: 'error', duration: 3000, message: stderr || error });
      return;
    }
    ElNotification({ title: '操作成功!', type: 'success', duration: 3000, message: stdout });
  })
}

watch(() => systemConfigStore.rememberCloseDialog, (val) => {
  rememberCloseDialog.value = val;
});

// 页面启动时加载
onMounted(() => {
  autoCheckUpdate.value = systemConfigStore.autoCheckUpdate;  // 是否自动检测更新
  isShowUpdateTip.value = systemConfigStore.isShowUpdateTip;  // 是否显示应用更新提醒
  rememberCloseDialog.value = systemConfigStore.rememberCloseDialog;  // 是否显示应用更新提醒
  defaultRepo.value = systemConfigStore.defaultRepoName;  // 默认仓库
  // 仓库源地址
  let rawSourceUrl = systemConfigStore.sourceUrl;
  if (Array.isArray(rawSourceUrl)) {
    sourceUrl.value = rawSourceUrl;
  } else if (rawSourceUrl && typeof rawSourceUrl === 'object') {
    // 如果是对象，转换为数组
    sourceUrl.value = Object.entries(rawSourceUrl).map(([name, url]) => ({ name, url }));
  } else {
    sourceUrl.value = [];
  }
  isShowBaseService.value = systemConfigStore.isShowBaseService;  // 是否显示基础运行服务
})
</script>

<style scoped>
.title {
  font-weight: bold;
  font-size: 16px;
  color: #D3D3D3;
  text-decoration: inherit;
}

@media (prefers-color-scheme: light) {
  .title {
    color: #000;
  }
}
</style>