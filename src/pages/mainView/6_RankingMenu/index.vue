<template>
  <div class="container">
    <el-tabs v-model="activeName" class="custom-tabs" @tab-click="handleClick">
      <el-tab-pane label="最新排行" name="first"></el-tab-pane>
      <el-tab-pane label="下载排行" name="second"></el-tab-pane>
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
  router.push(tab.paneName == "first" ? "/new_ranking" : "/down_ranking");
}
onMounted(() => {
  router.push("/new_ranking");
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
  /* height: 100%; */
  width: 100%;
}

:deep(.el-tabs__item) {
  color: #FFFFFF;
}
 
:deep(.el-tabs__item.is-active) {
  color: #409EFF;
  font-weight: bold;
}
</style>