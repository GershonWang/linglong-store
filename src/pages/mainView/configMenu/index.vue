<template>
  <div>
    <h1>设置页面</h1>
    <li>
      当前使用的源地址：
      <el-select class="chooseSource" v-model="defaultSource" @change="changeEvent">
        <el-option label="https://mirror-repo-linglong.deepin.com" value="https://mirror-repo-linglong.deepin.com" :key="1"/>
      </el-select>
    </li>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";

const defaultSource = ref("https://mirror-repo-linglong.deepin.com");
const changeEvent = (data:any) => {
  window.sessionStorage.setItem('sourceUrl',data);
}
</script>
<style scoped>
.chooseSource {
  width: 300px;
}
</style>
