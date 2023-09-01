<script setup lang="ts">
import MainPage from './components/MainPage.vue';
</script>

<template>
  <div>
    <a href="https://linglong.dev/" target="_blank">
      <img src="/logo.svg" class="logo vue" alt="玲珑商店" />
    </a>
  </div>
  <MainPage msg="玲珑应用商店" />
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
