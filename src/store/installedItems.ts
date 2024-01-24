import { defineStore } from "pinia";
import { reactive } from "vue";
import { CardFace } from "@/interface/CardFace";
import string2card from "@/util/string2card";

/**
 * 已安装的全部应用
 */
export const useInstalledItemsStore = defineStore("installedItems", () => {

    let installedItemList = reactive<CardFace[]>([]);
    /**
     * 初始化已安装程序数组
     * @param data 待处理的数据
     * @returns 将数据放入后的对象数组
     */
    const initInstalledItems = (data: string) => {
        const apps: string[] = data.split("\n");
        if (apps.length > 1) {
            // 第0条是分类项不是应用，需要剔除，最后一行空，也需要剔除
            for (let index = 1; index < apps.length - 1; index++) {
                const item: CardFace | null = string2card(apps[index]);
                // 去除空行和运行时服务
                if (!item || item.appId == "org.deepin.Runtime" || item.appId == 'org.deepin.basics') {
                    continue;
                }
                installedItemList.push(item)
            }
        }
        return installedItemList;
    }
    /**
     * 更新已安装程序列表的图标
     * @param allItems 所有程序对象数组
     * @returns 处理后的对象列表
     */
    const updateInstalledItemsIcons = (allItems: CardFace[]) => {
        // 从所有程序列表中更新已安装程序的icon
        for (let index = 0; index < installedItemList.length; index++) {
            const element = installedItemList[index];
            const findItem = allItems.find(item => item.appId == element.appId && item.name == element.name);
            if (findItem) {
                element.icon = findItem.icon;
            }
        }
        return installedItemList;
    }
    /**
     * 新增对象
     * @param item 要新增的对象
     */
    const addItem = (item: CardFace) => {
        installedItemList.push(item);
    };
    /**
     * 从对象数组中移除对象
     * @param item 要移除的对象
     */
    const removeItem = (item: CardFace) => {
        const index = installedItemList.findIndex((i) => i.appId === item.appId && i.name === item.name && i.version === item.version);
        if (index !== -1) {
            installedItemList.splice(index, 1);
        }
    };
    /**
     * 清空所有应用对象列表
     */
    const clearItems = () => {
        installedItemList.splice(0, installedItemList.length);
    };
    /**
     * 更新对象的加载状态
     * @param item 要更新的对象
     */
    const updateItemLoadingStatus = (item: CardFace,flag: boolean) => {
        const index = installedItemList.findIndex((it) => it.name === item.name && it.version === item.version && it.appId === item.appId);
        if (index !== -1) {
            const aItem = installedItemList[index];
            aItem.loading = flag;
            installedItemList.splice(index, 1, aItem);
        }
    }
    
    const getItem = (name: string) => {
        return installedItemList.find((item) => item.name === name);
    };
    const getItemIndex = (name: string) => {
        return installedItemList.findIndex((item) => item.name === name);
    };
    const getItemByName = (name: string) => {
        return installedItemList.find((item) => item.name === name);
    };

    return {
        installedItemList,
        initInstalledItems,
        updateInstalledItemsIcons,
        addItem,
        removeItem,
        clearItems,
        updateItemLoadingStatus,

        getItem,
        getItemIndex,
        getItemByName,
    };
});