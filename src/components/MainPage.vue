<template>
    <div>
        <a href="https://linglong.dev/" target="_blank">
            <img src="/logo.svg" class="logo vue" alt="玲珑商店" />
        </a>
    </div>
    <h1>玲珑应用商店</h1>
    <h4>正在进入商店：{{ mins }}秒</h4>
</template>
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const mins = ref(5);
let timerId: NodeJS.Timer | null = null; // 使用NodeJS.Timer类型

const startTimer = () => {
    timerId = setInterval(() => {
        if (mins.value == 1) {
            console.log("跳转到程序列表界面");
            router.push('/Index');
            return;
        }
        mins.value--;
    }, 1000); // 1秒钟执行一次
};

onMounted(() => {
    startTimer();
});

onBeforeUnmount(() => {
    if (timerId !== null) {
        clearInterval(timerId);
    }
});
</script>
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