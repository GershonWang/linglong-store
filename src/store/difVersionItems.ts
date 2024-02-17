import { defineStore } from "pinia";
import { ref } from "vue";
import { InstalledEntity } from "@/interface/InstalledEntity";
import { LocationQuery } from "vue-router";
import { useInstalledItemsStore } from "@/store/installedItems";

const installedItemsStore = useInstalledItemsStore();

export const useDifVersionItemsStore = defineStore("difVersionItems", () => {

    let difVersionItemList = ref<InstalledEntity[]>([]);
    /**
     * 初始化已安装程序数组
     * @param data 待处理的数据
     * @returns 将数据放入后的对象数组
     */
    const initDifVersionItems = (data: string, query: LocationQuery) => {
        const seachAppId = query.appId;
        clearItems(); // 清空原始对象
        const installedItemList: InstalledEntity[] = data.trim() ? JSON.parse(data.trim()) : [];
        if (installedItemList.length > 0) {
            for (let index = 0; index < installedItemList.length; index++) {
                const item: InstalledEntity = installedItemList[index];
                // 去除空行和运行时服务
                if (!item || item.appId != seachAppId || item.module == 'devel') {
                    continue;
                }
                item.isInstalled = installedItemsStore.installedItemList.some((it) => it.appId === item.appId && it.name === item.name && it.version === item.version);
                difVersionItemList.value.push(item);
            }
        }
        return difVersionItemList;
    }

    /**
     * 新增对象
     * @param item 要新增的对象
     */
    const addItem = (item: InstalledEntity) => {
        difVersionItemList.value.push(item);
    };
    /**
     * 从对象数组中移除对象
     * @param item 要移除的对象
     */
    const removeItem = (item: InstalledEntity) => {
        const index = difVersionItemList.value.findIndex((i) => i.appId === item.appId && i.name === item.name && i.version === item.version);
        if (index !== -1) {
            difVersionItemList.value.splice(index, 1);
        }
    };
    /**
     * 清空所有应用对象列表
     */
    const clearItems = () => {
        difVersionItemList.value.splice(0, difVersionItemList.value.length);
    };
    /**
     * 更新对象的安装状态
     * @param item 要更新的对象
     */
    const updateItemInstallStatus = (item: InstalledEntity) => {
        const index = difVersionItemList.value.findIndex((it) => it.name === item.name && it.version === item.version && it.appId === item.appId);
        if (index !== -1 && item.isInstalled != undefined) {
            const aItem = difVersionItemList.value[index];
            aItem.isInstalled = item.isInstalled;
            difVersionItemList.value.splice(index, 1, aItem);
        }
    }
    /**
     * 更新对象的加载状态
     * @param item 要更新的对象
     */
    const updateItemLoadingStatus = (item: InstalledEntity, flag: boolean) => {
        const index = difVersionItemList.value.findIndex((it) => it.name === item.name && it.version === item.version && it.appId === item.appId);
        if (index !== -1) {
            const aItem = difVersionItemList.value[index];
            aItem.loading = flag;
            difVersionItemList.value.splice(index, 1, aItem);
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