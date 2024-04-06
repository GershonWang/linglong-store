<template>
  <div class="container">
    <el-tabs v-model="activeName" class="custom-tabs" @tab-click="handleClick">
      <el-tab-pane label="最新上架(前100)" name="first"></el-tab-pane>
      <el-tab-pane label="下载量(前100)" name="second"></el-tab-pane>
    </el-tabs>
    <router-view></router-view>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import type { TabsPaneContext } from 'element-plus'

const activeName = ref('first')
// 路由对象
const router = useRouter();
// tab切换点击事件
const handleClick = (tab: TabsPaneContext, _event: Event) => {
  // 恢复保存的滚动位置
  const container = document.getElementsByClassName('new-container')[0] as HTMLDivElement;
  container.scrollTop = 0;
  router.push(tab.paneName == "first" ? "/new_ranking" : "/down_ranking");
}
onMounted(() => {
  const meta = router.currentRoute.value.meta;
  if (meta.savedTabName == "downRanking") {
    activeName.value = "second";
    router.push("/down_ranking");
  } else {
    activeName.value = "first";
    router.push("/new_ranking");
  }
})
</script>
<style scoped>
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

.custom-tabs {
  display: flex;
  justify-content: center;
  width: 100%;
  --el-tabs-header-height: 30px;
}

:deep(.el-tabs__item) {
  color: #0E0101;
  padding: 10px;
}

:deep(.el-tabs__item.is-active) {
  color: #DAAD71;
  font-weight: bold;
}

/* 隐藏滚动条 */
::-webkit-scrollbar {
    display: none;
}
</style>