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
        </div>
    </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { ipcRenderer } from "electron";
import { ElNotification } from 'element-plus'
import { useRouter } from 'vue-router';
// 获取路由对象
const router = useRouter();
// 倒计时(秒数)
const mins = ref(5);
// 定时任务对象
let timerId: NodeJS.Timeout;
// 命令执行返回结果
const commandResult = (_event: any, data: any) => {
    if ('stdout' != data.code && 'll-cli' == data.param.command) {
        // 当非正常返回时，弹出提示框并停止倒计时
        ElNotification({
            title: '系统异常',
            message: '当前系统不支持玲珑',
            type: 'error',
        });
        clearInterval(timerId);
    }
}
// 网络执行返回结果
const networkResult = (_event: any, res: any) => {
    let allItems = '[';
    if (res.code == '200') {
        const array = res.data.list;
        for (let i = 0; i < array.length; i++) {
            if (i != 0) allItems += ',';
            allItems += JSON.stringify(array[i]);
        }
    }
    allItems += ']';
    sessionStorage.setItem('allItems', allItems);
}
onMounted(() => {
    // 获取session中是否存有源地址，当不存在时，赋值默认地址
    if (sessionStorage.getItem('sourceUrl') == null) {
        sessionStorage.setItem('sourceUrl', 'https://mirror-repo-linglong.deepin.com');
    }
    // 开启定时器，倒计时进入主页面(1秒钟执行一次)
    timerId = setInterval(() => {
        if (mins.value == 1) {
            router.push('/main_view');
            return;
        }
        mins.value--;
    }, 1000);
    // 发送命令，检测当前系统是否支持玲珑
    ipcRenderer.send('command', { command: 'll-cli' });
    ipcRenderer.on('command-result', commandResult);
    // 发送网络命令，获取源内所有应用，并返回结果存储到session中
    ipcRenderer.send('network', { url: sessionStorage.getItem('sourceUrl') + '/api/v0/web-store/apps??page=1&size=100000' });
    ipcRenderer.on('network-result', networkResult);
});

onBeforeUnmount(() => {
    clearInterval(timerId)
    ipcRenderer.removeListener('command-result', commandResult);
    ipcRenderer.removeListener('network-result', networkResult);
});
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