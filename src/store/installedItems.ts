import { defineStore } from "pinia";
import { ref } from "vue";
import { CardFace } from "@/interface/CardFace";
import { InstalledEntity } from "@/interface/InstalledEntity";

/**
 * 已安装的全部应用
 */
export const useInstalledItemsStore = defineStore("installedItems", () => {

    let installedItemList = ref<InstalledEntity[]>([]);
    /**
     * 初始化已安装程序数组
     * @param data 待处理的数据
     * @returns 将数据放入后的对象数组
     */
    const initInstalledItems = (data: string) => {
        const installedItemList11 = data.trim() ? JSON.parse(data.trim()) : [];
        if (installedItemList11.length > 0) {
            installedItemList11.forEach((item: InstalledEntity) => {
                // 去除空行和运行时服务
                if (item && item.appId != "org.deepin.Runtime" && item.appId != 'org.deepin.basics') {
                    installedItemList.value.push(item);
                }
            })
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
        for (let index = 0; index < installedItemList.value.length; index++) {
            const element = installedItemList.value[index];
            const findItem = allItems.find(item => item.appId == element.appId && item.name == element.name);
            if (findItem && findItem.icon) {
                element.icon = findItem.icon;
            }
        }
        return installedItemList;
    }
    /**
     * 新增对象
     * @param item 要新增的对象
     */
    const addItem = (item: InstalledEntity) => {
        installedItemList.value.push(item);
    };
    /**
     * 从对象数组中移除对象
     * @param item 要移除的对象
     */
    const removeItem = (item: InstalledEntity) => {
        const index = installedItemList.value.findIndex((i) => i.appId === item.appId && i.name === item.name && i.version === item.version);
        if (index !== -1) {
            installedItemList.value.splice(index, 1);
        }
    };
    /**
     * 清空所有应用对象列表
     */
    const clearItems = () => {
        installedItemList.value.splice(0, installedItemList.value.length);
    };
    /**
     * 更新对象的加载状态
     * @param item 要更新的对象
     */
    const updateItemLoadingStatus = (item: InstalledEntity,flag: boolean) => {
        const index = installedItemList.value.findIndex((it) => it.name === item.name && it.version === item.version && it.appId === item.appId);
        if (index !== -1) {
            const aItem = installedItemList.value[index];
            aItem.loading = flag;
            installedItemList.value.splice(index, 1, aItem);
        }
    }
    
    return {
        installedItemList,
        initInstalledItems,
        updateInstalledItemsIcons,
        addItem,
        removeItem,
        clearItems,
        updateItemLoadingStatus,
    };
});