<template>
    <el-breadcrumb :separator-icon="ArrowRight">
        <el-breadcrumb-item class="first-menu" @click="router.back">{{ query.menuName }}</el-breadcrumb-item>
        <el-breadcrumb-item class="second-menu">{{ query.name }}</el-breadcrumb-item>
    </el-breadcrumb>
    <div class="apps-container" @scroll="handleScroll">
        <div class="card-items-container" v-if="displayedItems && displayedItems.length > 0">
            <div class="card-items" v-for="(item, index) in displayedItems" :key="index">
                <SearchCard :name="item.name" :version="item.version" :description="item.description" :arch="item.arch"
                    :isInstalled="item.isInstalled" :appId="item.appId" :icon="item.icon" :loading="item.loading" :zhName="item.zhName"
                    :size="item.size"/>
            </div>
        </div>
        <div class="no-data-container" v-else>
            <div style="width: 180px;height: 300px;">
                <img class="image" :src="defaultImage" alt="Image" />
            </div>
            <h1>查无数据</h1>
        </div>
    </div>
</template>
<script setup lang="ts">
import { nextTick, onMounted, reactive, ref } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import { ArrowRight } from '@element-plus/icons-vue'
import SearchCard from "@/components/searchCard.vue";
import { CardFace } from '@/interface';
import defaultImage from '@/assets/logo.svg';
import elertTip from "@/util/NetErrorTips";
import { useAllServItemsStore } from "@/store/allServItems";
import { useRouter } from 'vue-router';

const router = useRouter();

const allServItemsStore = useAllServItemsStore();
// 获取全部程序列表
const allItems = allServItemsStore.allServItemList;
// 获取显示的程序列表
const displayedItems = reactive<CardFace[]>([]);
// 路由传递的对象
const query = router.currentRoute.value.query;
// 搜索框输入的值
const searchName = ref('');
// 记录是否启用滚动条查询
let isScrollQuery = ref(true);
// 记录当前页数
let pageNo = ref(1);
let pageSize = ref(50);
// 明细页返回执行事件
const recover = async (msg: string, savedPageNo: number, savedPageSize: number) => {
    // 执行搜索前，都进行数组的重置操作
    displayedItems.splice(0, displayedItems.length);
    // 执行搜索前，都进行页码重置到第一页的操作
    pageNo.value = savedPageNo;
    pageSize.value = savedPageSize;
    // 消息内容存在时，修改滚动条监听事件的状态为false
    isScrollQuery.value = !msg;
    if (allItems && allItems.length > 0) { // 网络应用数据不为空才进行后续操作
        const temp = reactive<CardFace[]>([]);
        for (let index = 0; index < allItems.length; index++) {
            const element: CardFace = allItems[index];
            const name = element.name.toLowerCase();
            const description = element.description?.toLowerCase();
            const message = msg.toLowerCase();
            if (name.includes(message) || description?.includes(message)) {
                temp.push(element);
            }
        }
        if (temp.length > 0) {
            let endNum = savedPageNo * savedPageSize;
            if (endNum > temp.length) endNum = temp.length;
            for (let index = 0; index < endNum; index++) {
                const element: CardFace = temp[index];
                displayedItems.push(element);
            }
        }
        // 等待下一次 DOM 更新
        await nextTick();
        // 恢复保存的滚动位置
        const container = document.getElementsByClassName('apps-container')[0] as HTMLDivElement;
        container.scrollTop = Number(router.currentRoute.value.meta.savedPosition) || 0;
    }
}
// 滚动条监听事件
const handleScroll = () => {
    if (isScrollQuery.value) {
        const container = document.getElementsByClassName('apps-container')[0] as HTMLDivElement;
        // 判断滚动条位置是否接近底部，如果接近则加载更多数据(滚动位置 + 窗口高度 >= 内容高度)
        if (container.scrollTop + container.clientHeight >= container.scrollHeight) {
            let startNum = pageNo.value * pageSize.value; // 当前起始索引
            let endNum = startNum + pageSize.value; // 加一页
            if (startNum > allItems.length) return;
            if (endNum > allItems.length) endNum = allItems.length;
            for (let index = startNum; index < endNum; index++) {
                const element = allItems[index];
                displayedItems.push(element);
            }
            pageNo.value++;
        }
    }
}
onMounted(() => {
    // 检测网络
    elertTip();
    // 查询程序展示软件列表
    const meta = router.currentRoute.value.meta;
    if (meta.savedPageNo && meta.savedPageSize) {
        const savedPageNo = meta.savedPageNo as number;
        const savedPageSize = meta.savedPageSize as number;
        const savedSearchName = meta.savedSearchName as string;
        searchName.value = savedSearchName;
        recover(savedSearchName, savedPageNo, savedPageSize);
    } else {
        let msg = '';
        if (query.name == '深度制造') {
            msg = 'deepin';
        } else if (query.name == '游戏竞技') {
            msg = '游戏';
        } else if (query.name == '开发系统') {
            msg = '开发';
        }
        searchName.value = msg;
        recover(msg, 1, 50);
    }
})
// 在router路由离开前执行
onBeforeRouteLeave((to, _from, next) => {
    const container = document.getElementsByClassName('apps-container')[0] as HTMLDivElement;
    to.meta.savedPosition = container.scrollTop; // 将滚动位置保存到路由元数据中
    to.meta.savedPageNo = pageNo.value; // 将页码保存到路由元数据中
    to.meta.savedPageSize = pageSize.value; // 将每页条数保存到路由元数据中
    to.meta.savedSearchName = searchName.value; // 将搜索内容保存到路由元数据中
    next();
})
</script>
<style scoped>
.apps-container {
    height: calc(100% - 37px);
}
</style>