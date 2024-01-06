<template>
    <div class="search">
        <transition name="el-zoom-in-bottom">
            <div v-show="show" class="transition-box">
                <el-input ref="inputRef" v-model="searchName" placeholder="请输入要搜索的程序名" style="width: 300px;"
                    @input="searchSoft">
                    <template #prefix>
                        <el-icon class="el-input__icon">
                            <search />
                        </el-icon>
                    </template>
                </el-input>
            </div>
        </transition>
        <div class="search_image">
            <img src="@/assets/search.svg" @click="openInput(show)">
        </div>
    </div>
    <div class="container" ref="containRef" @scroll="handleScroll">
        <div class="card_container" v-if="hasData">
            <div class="card_items" v-for="(item, index) in displayedItems" :key="index">
                <Card :name="item.name" :version="item.version" :description="item.description" :arch="item.arch"
                    :isInstalled="item.isInstalled" :appId="item.appId" :icon="item.icon" :index="index"
                    :loading="loading[index]" @pauseLoading="pauseLoading(index)" />
            </div>
        </div>
        <div class="card_container" v-else>
            <div style="position: absolute;left: 50%;transform: translate(-50%);text-align: center;">
                <h1>查无数据</h1>
                <el-button type="primary" @click="retryEvent">重试</el-button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { ipcRenderer } from 'electron';
import { ElNotification } from 'element-plus'
import { CardFace } from "@/components/CardFace";
import Card from "@/components/Card.vue";
// 存储在session里源内所有程序数组
const allItems = sessionStorage.getItem('allItems');
// 用于存储当前显示的卡片对象
const displayedItems = reactive<CardFace[]>([]);
// 用于存储当前系统已安装的卡片对象
const installedItems = reactive<CardFace[]>([]);
// 全部程序列表容器对象
const containRef = ref<HTMLElement>();
// 是否显示搜索框
const show = ref(false);
// 搜索框对象
const inputRef = ref<HTMLElement>();
// 搜索框输入的值
const searchName = ref('');
// 重试次数
let retryNum = ref(0);
// 记录是否启用滚动条查询
let isScrollQuery = ref(true);
// 记录当前页数
let pageNo = ref(1);
let pageSize = ref(50);
// 是否有列表数据
let hasData = ref(false);

const loading = ref(Array(displayedItems.length).fill(false));
const pauseLoading = (index: number) => {
    loading.value[index] = false;
};
/**
 * 根据分页条件查询网络玲珑应用
 * @param pageNo 页数
 * @param pageSize 每页条数
 */
const fetchData = async (pageNo: number, pageSize: number) => {
    let startNum = pageNo == 1 ? 0 : pageNo * pageSize;
    let endNum = startNum + pageSize;
    if (allItems) {
        const all = JSON.parse(allItems);
        if (all.length > 0) {
            if (startNum > all.length) return;
            if (endNum > all.length) endNum = all.length;
            for (let index = startNum; index < endNum; index++) {
                const element = all[index];
                element.isInstalled = installedItems.some(it => it.appId == element.appId && it.version == element.version);
                displayedItems.push(element);
            }
        }
    }
}
// 点击重试获取应用列表
const retryEvent = () => {
    console.log('retryEvent');
}
// 搜索框监听输入变更事件
const searchSoft = (msg: string) => {
    // 执行搜索前，都进行数组的重置操作
    displayedItems.splice(0, displayedItems.length);
    if (allItems) {
        // 修改滚动条监听事件的状态
        isScrollQuery.value = !msg;
        // string转json
        const all = JSON.parse(allItems);
        if (all.length > 0) {
            hasData.value = true;
            let max = msg ? all.length : 50;
            // 根据消息msg对象是否为空，设置页码重置
            if (!msg) {
                pageNo.value = 1;
                pageSize.value = max;
            }
            // 遍历数组，根据消息msg对象是否为空，设置数组显示内容
            for (let index = 0; index < max; index++) {
                const element = all[index];
                if (!element.name.includes(msg)) {
                    continue;
                }
                element.isInstalled = installedItems.some(it => it.appId == element.appId && it.version == element.version);
                displayedItems.push(element);
            }
            return;
        }
    }
    hasData.value = false;
}
// 搜索图标的点击事件
const openInput = (status: boolean) => {
    show.value = !status;
    if (inputRef.value) {
        if (status) {
            inputRef.value.blur();
        } else {
            inputRef.value.focus();
        }
    }
}
// 滚动条监听事件
const handleScroll = () => {
    if (isScrollQuery.value && containRef.value) {
        const scrollPosition = containRef.value.scrollTop; // 获取滚动位置
        const windowHeight = containRef.value.clientHeight; // 获取窗口高度
        const contentHeight = containRef.value.scrollHeight; // 获取内容高度
        const scrollbarHeight = contentHeight - windowHeight; // 计算滚动条长度
        if (scrollPosition != 0 && scrollbarHeight != 0 && scrollbarHeight >= scrollPosition
            && scrollbarHeight - parseInt(String(scrollPosition)) <= 1) {
            pageNo.value += 1;
            fetchData(pageNo.value, pageSize.value);
        }
    }
}
// 监听屏幕宽度变化
const changeScreenWidth = () => {
    const screenWidth = window.innerWidth;
    console.log('屏幕宽度：', screenWidth / 200);
};
// 命令执行结束返回结果
const commandResult = (_event: any, res: any) => {
    const params = res.param;
    const result = res.result;
    const code = res.code;
    if ('stdout' != code) {
        if (retryNum.value <= 3) {
            retryNum.value++;
            ipcRenderer.send('command', params);
        } else {
            retryNum.value = 0;
            ElNotification({
                title: '请求错误',
                message: '命令执行异常！',
                type: 'error',
            });
        }
        return;
    }
    // 返回结果 - 查询当前已安装的玲珑应用列表
    if (params.command == 'll-cli list') {
        const apps = result.split("\n");
        if (apps.length > 1) {
            const header = apps[0].split('[1m[38;5;214m')[1];
            const appIdNum = header.indexOf('appId');
            const nameNum = header.indexOf('name');
            const versionNum = header.indexOf('version');
            const archNum = header.indexOf('arch');
            const channelNum = header.indexOf('channel');
            const moduleNum = header.indexOf('module');
            const descriptionNum = header.indexOf('description');
            // 第0条是分类项不是应用，需要剔除，最后一行空，也需要剔除
            for (let index = 1; index < apps.length - 1; index++) {
                const element = apps[index];
                const appId = element.substring(appIdNum, nameNum).trim();
                // 去除运行时服务
                if (appId == 'org.deepin.Runtime') {
                    continue;
                }
                const items = element.match(/'[^']+'|\S+/g);
                // const name = element.substring(nameNum, versionNum).trim();
                const name = items[1];
                // const version = element.substring(versionNum, archNum).trim();
                const version = items[2];
                // const arch = element.substring(archNum, channelNum).trim();
                const arch = items[3];
                // const channel = element.substring(channelNum, moduleNum).trim();
                const channel = items[4];
                // const module = element.substring(moduleNum, descriptionNum).trim();
                const module = items[5];
                // const description = element.substring(descriptionNum).trim();
                const description = items[6];
                let icon = "";
                if (allItems != null && allItems.length > 0) {
                    const all = JSON.parse(allItems);
                    const its = all.find((it: CardFace) => it.appId == appId && it.version == version)
                    if (its) {
                        icon = its.icon;
                    }
                }
                installedItems.push({
                    appId: appId,
                    name: name ? name : '-',
                    version: version,
                    arch: arch,
                    channel: channel,
                    module: module,
                    description: description,
                    icon: icon
                });
            }
        }
        // 查询程序展示软件列表
        searchSoft(searchName.value);
    }
    // 返回结果 - 当前执行安装的应用信息
    if (params.command.startsWith('ll-cli install')) {
        // 安装成功后，更新已安装应用列表
        displayedItems.splice(params.index, 1, {
            icon: params.icon,
            name: params.name,
            version: params.version,
            description: params.description,
            arch: params.arch,
            isInstalled: true,
            appId: params.appId,
            loading: false
        });
        // 安装成功后，弹出通知
        ElNotification({
            title: '安装成功',
            message: params.name + '(' + params.version + ')被成功安装!',
            type: 'success',
        });
    }
    // 返回结果 - 当前执行卸载的应用信息
    if (params.command.startsWith('ll-cli uninstall')) {
        // 卸载成功后，更新已安装应用列表
        displayedItems.splice(params.index, 1, {
            icon: params.icon,
            name: params.name,
            version: params.version,
            description: params.description,
            arch: params.arch,
            isInstalled: false,
            appId: params.appId,
            loading: false
        });
        // 卸载成功后，弹出通知
        ElNotification({
            title: '卸载成功',
            message: params.name + '(' + params.version + ')被成功卸载!',
            type: 'success',
        });
    }
}
// 组件初始化时加载
onMounted(() => {
    window.addEventListener("resize", changeScreenWidth);
    ipcRenderer.on('command-result', commandResult);
    ipcRenderer.send('command', { name: '查询已安装程序列表', command: 'll-cli list' });
});
// 在组件销毁时移除事件监听器
onBeforeUnmount(() => {
    window.removeEventListener("resize", changeScreenWidth);
    ipcRenderer.removeListener('command-result', commandResult);
});
</script>

<style scoped>
.search {
    margin: 10px auto;
    position: fixed;
    z-index: 999;
    bottom: 20px;
    right: 50px;
}

.transition-box {
    margin-bottom: 60px;
    border-radius: 10px;
    background-color: #CA0317;
    text-align: center;
    color: #fff;
    padding: 40px 20px;
    box-sizing: border-box;
    margin-right: 10px;
}

.search_image {
    height: 48px;
    position: fixed;
    bottom: 30px;
    right: 60px;
    border-radius: 15px;
    background-color: #CA0317;
    padding: 5px;
}

.container {
    height: 100%;
    overflow-y: auto;
}

.card_container {
    display: -webkit-inline-box;
    flex-wrap: wrap;
    justify-content: space-around;
    gap: 10px;
}

.card_items {
    padding: 10px;
    flex: 1;
    min-width: 225px;
    border: 1px solid #ccc;
    border-radius: 5px;
    box-sizing: border-box;
    background-color: #999999;
}
</style>