<template>
  <div>
    <h1>关于页面</h1>
    <li>
      <a class="title">项目环境</a>
    </li>
    <div class="item">Node版本：{{ versions.node }}</div>
    <div class="item">Electron版本：{{ versions.electron }}</div>
    <div class="item">Chrome版本：{{ versions.chrome }}</div>
    <br>
    <li>
      <a class="title">玲珑信息</a>
    </li>
    <div class="item">玲珑官网：<a class="link" href="https://linglong.dev/" target="_blank">https://linglong.dev/</a></div>
    <div class="item">玲珑网页版商店：<a class="link" href="https://store.linglong.dev/" target="_blank">https://store.linglong.dev/</a></div>
    <br>
    <li>
      <a class="title">版本信息</a>
    </li>
    <div class="item">当前版本: {{ pkg.version }}</div>
    <div class="item">开发作者：{{ pkg.author }}</div>
    <div class="item">
      github地址：<a class="link" href="https://github.com/GershonWang/linglong_store" target="_blank">https://github.com/GershonWang/linglong_store</a>
    </div>
  </div>
</template>
<script setup lang="ts">
import pkg from '../../../../package.json';
const versions = process.versions;

</script>
<style scoped>
.title {
  font-weight: bold;
  font-size: 18px;
  color: #D3D3D3;
  text-decoration: inherit;
}
.item {
  text-indent: 2em;
}
.link {
  font-weight: bold;
  color: #D3D3D3;
  text-decoration: inherit;
}
.link:hover {
  color: #af2f9e;
}
</style>