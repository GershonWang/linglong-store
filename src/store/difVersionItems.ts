import { defineStore } from "pinia";
import { reactive } from "vue";
import { CardFace } from "@/interface/CardFace";
import string2card from "@/util/string2card";
import { LocationQuery } from "vue-router";
import { useInstalledItemsStore } from "@/store/installedItems";

const installedItemsStore = useInstalledItemsStore();

export const useDifVersionItemsStore = defineStore("difVersionItems", () => {

    let difVersionItemList = reactive<CardFace[]>([]);
    /**
     * 初始化已安装程序数组
     * @param data 待处理的数据
     * @returns 将数据放入后的对象数组
     */
    const initDifVersionItems = (data: string,query: LocationQuery) => {
        // 清空原始对象
        clearItems();
        const apps: string[] = data.split("\n");
        const seachAppId = query.appId;
        const installedItemList = installedItemsStore.installedItemList;
        if (apps.length > 1) {
            // 第0条是分类项不是应用，需要剔除，最后一行空，也需要剔除
            for (let index = 1; index < apps.length - 1; index++) {
                const item: CardFace | null = string2card(apps[index]);
                // 去除空行和运行时服务
                if (!item || item.appId != seachAppId || item.module == 'devel') {
                    continue;
                }
                item.isInstalled = installedItemList.some((it) => it.appId === item.appId && it.name === item.name && it.version === item.version);
                difVersionItemList.push(item);
            }
        }
        return difVersionItemList;
    }

    /**
     * 新增对象
     * @param item 要新增的对象
     */
    const addItem = (item: CardFace) => {
        difVersionItemList.push(item);
    };
    /**
     * 从对象数组中移除对象
     * @param item 要移除的对象
     */
    const removeItem = (item: CardFace) => {
        const index = difVersionItemList.findIndex((i) => i.appId === item.appId && i.name === item.name && i.version === item.version);
        if (index !== -1) {
            difVersionItemList.splice(index, 1);
        }
    };
    /**
     * 清空所有应用对象列表
     */
    const clearItems = () => {
        difVersionItemList.splice(0, difVersionItemList.length);
    };
    /**
     * 更新对象的安装状态
     * @param item 要更新的对象
     */
        const updateItemInstallStatus = (item: CardFace) => {
            const index = difVersionItemList.findIndex((it) => it.name === item.name && it.version === item.version && it.appId === item.appId);
            if (index !== -1) {
                const aItem = difVersionItemList[index];
                aItem.isInstalled = item.isInstalled;
                difVersionItemList.splice(index, 1, aItem);
            }
        }
    /**
     * 更新对象的加载状态
     * @param item 要更新的对象
     */
    const updateItemLoadingStatus = (item: CardFace,flag: boolean) => {
        const index = difVersionItemList.findIndex((it) => it.name === item.name && it.version === item.version && it.appId === item.appId);
        if (index !== -1) {
            const aItem = difVersionItemList[index];
            aItem.loading = flag;
            difVersionItemList.splice(index, 1, aItem);
        }
    }

    return {
        difVersionItemList,
        initDifVersionItems,
        addItem,
        removeItem,
        clearItems,
        updateItemInstallStatus,
        updateItemLoadingStatus,
    };
});