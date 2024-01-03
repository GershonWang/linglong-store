<template>
    <div class="containner">
        <a href="https://linglong.dev/" target="_blank">
            <img src="/logo.svg" class="logo" alt="玲珑商店" />
        </a>
        <h1>玲珑应用商店</h1>
        <h4>正在进入商店：{{ mins }}秒</h4>
        <div style="text-align: left;">
            <h3 style="color: chocolate;">PS注意：</h3>
            <p>1.刚程序运行时，会检测当前系统是否满足玲珑环境，不满足，倒计时加载会卡住不动并弹出提示，程序不会进入到后续界面;这里需要您手动安装玲珑环境方可使用。</p>
            <p>2.点击安装时，受网速和程序大小的影响，程序安装比较缓慢甚至可能会没反应，此时无需操作耐心等待程序安装成功提示即可。</p>
            <p>3.卸载程序时，第一次点击会提示异常，可以再次点击卸载即可卸载成功。</p>
        </div>
    </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { ipcRenderer } from "electron";
import { ElNotification } from 'element-plus'
import { useRouter } from 'vue-router';

const router = useRouter();
const mins = ref(10);
let timerId: NodeJS.Timeout; // 使用NodeJS.Timer类型

onMounted(() => {
    if (sessionStorage.getItem('sourceUrl') == null) {
        sessionStorage.setItem('sourceUrl','https://mirror-repo-linglong.deepin.com');
    }
    timerId = setInterval(() => {
        if (mins.value == 1) {
            router.push('/main_view');
            return;
        }
        mins.value--;
    }, 1000); // 1秒钟执行一次
    ipcRenderer.send('command', { command: 'll-cli' });
    ipcRenderer.on('command-result', (_event, data) => {
        if ('stdout' != data.code) {
            // 当非正常返回时，弹出提示框并停止倒计时
            ElNotification({
                title: '系统异常',
                message: '当前系统不支持玲珑',
                type: 'error',
            });
            clearInterval(timerId);
        }
    });
    ipcRenderer.send('network', {url: sessionStorage.getItem('sourceUrl') + '/api/v0/web-store/apps??page=1&size=100000'});
    ipcRenderer.on('network-result', (_event, data) => {
        console.log(data);
        let allItems = '[';
        if(data.code == 'network') {
            const array = data.data.data.list;
            for (let i = 0; i < array.length; i++) {
                if(i != 0) allItems += ',';
                allItems += JSON.stringify(array[i]);
            }
        }
        allItems += ']';
        sessionStorage.setItem('allItems',allItems);
    });
});

onBeforeUnmount(() => clearInterval(timerId));
</script>
<style scoped>
.containner {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
}
.logo {
    height: 6em;
    padding: 1.5em;
    will-change: filter;
    transition: filter 300ms;
}
.logo:hover {
    filter: drop-shadow(0 0 2em #646cffaa);
}
</style>