import { defineStore } from "pinia";
import { ref } from "vue";
import { InstalledEntity } from "@/interface/InstalledEntity";
import { useAllServItemsStore } from "@/store/allServItems";
import { useInstalledItemsStore } from "@/store/installedItems";
import { CardFace } from "@/interface/CardFace";

const allServItemsStore = useAllServItemsStore();
const installedItemsStore = useInstalledItemsStore();

export const useWelcomeItemsStore = defineStore("welcomeItems", () => {

    let welcomeItemList = ref<InstalledEntity[]>([]);

    /**
     * 初始化已安装程序数组
     * @param data 待处理的数据
     * @returns 将数据放入后的对象数组
     */
    const initWelcomeItems = () => {
        // 清除welcomeItemList数组对象
        welcomeItemList.value = [];
        const allItems = allServItemsStore.allServItemList;
        for (let index = 0; index < allItems.length; index++) {
            const element: CardFace = allItems[index];
            const installedEntity: InstalledEntity = {
                appId: element.appId,
                arch: element.arch,
                channel: element.channel ? element.channel : '',
                description: element.description ? element.description : '',
                icon: element.icon ? element.icon : '',
                kind: "",
                module: element.module ? element.module : '',
                name: element.name,
                repoName: "",
                runtime: "",
                size: "",
                uabUrl: "",
                user: "",
                version: element.version,
                isInstalled: false,
                loading: false
            }
            if (element.appId == 'cn.wps.wps-office') {
                installedEntity.name = 'WPS办公';
                installedEntity.isInstalled = installedItemsStore.installedItemList.some((it) => it.appId === element.appId && it.name === element.name);
                welcomeItemList.value.push(installedEntity);
                continue;
            }
            if (element.appId == 'com.jetbrains.intellij-idea-ultimate') {
                installedEntity.name = 'IDEA开发工具';
                installedEntity.isInstalled = installedItemsStore.installedItemList.some((it) => it.appId === element.appId && it.name === element.name);
                welcomeItemList.value.push(installedEntity);
                continue;
            }
            if (element.appId == 'com.xunlei.download') {
                installedEntity.name = 'Linux迅雷';
                installedEntity.isInstalled = installedItemsStore.installedItemList.some((it) => it.appId === element.appId && it.name === element.name);
                welcomeItemList.value.push(installedEntity);
                continue;
            }
            if (element.appId == 'com.qq.wemeet') {
                installedEntity.name = '腾讯会议';
                installedEntity.isInstalled = installedItemsStore.installedItemList.some((it) => it.appId === element.appId && it.name === element.name);
                welcomeItemList.value.push(installedEntity);
                continue;
            }
            if (element.appId == 'cn.google.chrome') {
                installedEntity.name = '谷歌浏览器';
                installedEntity.isInstalled = installedItemsStore.installedItemList.some((it) => it.appId === element.appId && it.name === element.name);
                welcomeItemList.value.push(installedEntity);
                continue;
            }
            if (element.appId == 'com.qq.music') {
                installedEntity.name = 'QQ音乐';
                installedEntity.isInstalled = installedItemsStore.installedItemList.some((it) => it.appId === element.appId && it.name === element.name);
                welcomeItemList.value.push(installedEntity);
                continue;
            }
            if (element.appId == 'com.qianxin.browser-stable') {
                installedEntity.name = '奇安信浏览器';
                installedEntity.isInstalled = installedItemsStore.installedItemList.some((it) => it.appId === element.appId && it.name === element.name);
                welcomeItemList.value.push(installedEntity);
                continue;
            }
            if (element.appId == 'net.supertuxkart') {
                installedEntity.name = '超级赛车游戏';
                installedEntity.isInstalled = installedItemsStore.installedItemList.some((it) => it.appId === element.appId && it.name === element.name);
                welcomeItemList.value.push(installedEntity);
                continue;
            }
            if (element.appId == 'cc.modao.mockitt') {
                installedEntity.name = '墨刀办公';
                installedEntity.isInstalled = installedItemsStore.installedItemList.some((it) => it.appId === element.appId && it.name === element.name);
                welcomeItemList.value.push(installedEntity);
                continue;
            }
            if (element.appId == 'com.visualstudio.code') {
                installedEntity.name = 'VS Code';
                installedEntity.isInstalled = installedItemsStore.installedItemList.some((it) => it.appId === element.appId && it.name === element.name);
                welcomeItemList.value.push(installedEntity);
                continue;
            }
        }
        return welcomeItemList;
    }
    /**
     * 更新对象的安装状态
     * @param item 要更新的对象
     */
    const updateItemInstallStatus = (item: InstalledEntity) => {
        const index = welcomeItemList.value.findIndex((it) => it.name === item.name && it.version === item.version && it.appId === item.appId);
        if (index !== -1 && item.isInstalled != undefined) {
            const aItem = welcomeItemList.value[index];
            aItem.isInstalled = item.isInstalled;
            welcomeItemList.value.splice(index, 1, aItem);
        }
    }
    /**
     * 更新对象的加载状态
     * @param item 要更新的对象
     */
    const updateItemLoadingStatus = (item: InstalledEntity, flag: boolean) => {
        const index = welcomeItemList.value.findIndex((it) => it.name === item.name && it.version === item.version && it.appId === item.appId);
        if (index !== -1) {
            const aItem = welcomeItemList.value[index];
            aItem.loading = flag;
            welcomeItemList.value.splice(index, 1, aItem);
        }
    }
    return {
        welcomeItemList,
        initWelcomeItems,
        updateItemInstallStatus,
        updateItemLoadingStatus,
    }

}, { persist: true });