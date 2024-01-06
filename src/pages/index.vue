<template>
    <div class="containner">
        <a href="https://linglong.dev/" target="_blank">
            <img src="/logo.svg" class="logo" alt="玲珑商店" />
        </a>
        <h1>玲珑应用商店</h1>
        <h3>{{ message }}</h3>
        <div style="text-align: left;">
            <h3 style="color: chocolate;">PS注意：</h3>
            <p>1.刚程序运行时，会检测当前系统是否满足玲珑环境，不满足，倒计时加载会卡住不动并弹出提示，程序不会进入到后续界面;这里需要您手动安装玲珑环境方可使用。</p>
            <p>2.点击安装时，受网速和程序大小的影响，程序安装比较缓慢甚至可能会没反应，此时无需操作耐心等待程序安装成功提示即可。</p>
        </div>
    </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, h } from 'vue';
import { ElMessageBox } from 'element-plus'
import { ipcRenderer } from "electron";
import { CardFace } from "@/components/CardFace";
import { useRouter } from 'vue-router';
import { useStore } from "@/store/user";
const store = useStore();
console.log('store', store.name);

// 存储在session里的玲珑源地址
const sourceUrl = sessionStorage.getItem('sourceUrl');
// 存储在session里的是否过滤非当前系统架构的软件
const checkedArch = sessionStorage.getItem('checkedArch');
// 获取路由对象
const router = useRouter();
// 倒计时(秒数)
const mins = ref(0);
// 提示信息
const message = ref('加载中...');
// 定时任务对象
let timerId: NodeJS.Timeout = setInterval(() => {
    mins.value = (mins.value % 3) + 1;
    message.value = '加载中' + '.'.repeat(mins.value);
}, 1000);;
// 命令执行返回结果
const commandResult = (_event: any, res: any) => {
    if ('ll-cli' == res.param.command) {
        if ('stdout' != res.code) {
            // 清除定时任务
            clearInterval(timerId);
            // 设置提示信息
            ElMessageBox({
                title: '警告',
                message: h('p', null, [
                    h('span', null, '当前系统未安装 '),
                    h('i', { style: 'color: #025BFF' }, '玲珑环境'),
                ]),
                showCancelButton: true,
                confirmButtonText: '安装',
                cancelButtonText: '退出',
                beforeClose: (action, instance, done) => {
                    if (action === 'confirm') {
                        instance.confirmButtonLoading = true
                        instance.confirmButtonText = '加载中...'
                        setTimeout(() => {
                            done()
                            setTimeout(() => {
                                instance.confirmButtonLoading = false
                            }, 300)
                        }, 3000)
                    }
                    else {
                        window.close();
                    }
                },
            }).then(() => {
                window.open('https://linglong.dev/guide/start/install.html');
                window.close();
            })
        } else {
            // 发送网络命令，获取源内所有应用，并返回结果存储到session中
            const baseUrl = sessionStorage.getItem('sourceUrl');
            ipcRenderer.send('network', { url: baseUrl + '/api/v0/web-store/apps??page=1&size=100000' });
        }
    }
    if ('stdout' == res.code && 'uname -m' == res.param.command) {
        sessionStorage.setItem('systemInfo', res.result);
    }
}
// 网络执行返回结果
const networkResult = (_event: any, res: any) => {
    let allItems = '[';
    console.log(res);
    if (res.code == 200) {
        const array = res.data.list;
        for (let i = 0; i < array.length; i++) {
            const item: CardFace = array[i];
            const arch: string | undefined = item.arch?.trim();
            const systemInfo: string | undefined = sessionStorage.getItem('systemInfo')?.trim();
            const checked = sessionStorage.getItem('checkedArch');
            if (checked === 'true' && arch != systemInfo) {
                continue;
            }
            allItems += JSON.stringify(item) + ',';
        }
        if (allItems.length > 1) {
            allItems = allItems.substring(0, allItems.length - 1);
        }
    }
    allItems += ']';
    sessionStorage.setItem('allItems', allItems);
    router.push('/main_view');
}
onMounted(() => {
    // 获取session中是否存有源地址，当不存在时，赋值默认地址
    sessionStorage.setItem('sourceUrl', sourceUrl ? sourceUrl : 'https://mirror-repo-linglong.deepin.com');
    // 获取session中是否存有过滤非架构的程序，当不存在时，赋值默认地址
    sessionStorage.setItem('checkedArch', checkedArch ? checkedArch : 'true');
    // 监听命令行执行结果
    ipcRenderer.on('command-result', commandResult);
    // 监听网络请求执行结果
    ipcRenderer.on('network-result', networkResult);
    // 发送命令，获取当前系统架构
    ipcRenderer.send('command', { command: 'uname -m' });
    // 发送命令，检测当前系统是否支持玲珑
    ipcRenderer.send('command', { command: 'll-cli' });

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