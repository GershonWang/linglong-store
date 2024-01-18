import { defineStore } from "pinia";
import { reactive } from "vue";
import { CardFace } from "@/components/CardFace";
import { useSysConfStore } from "@/store/sysConf";

const sysConfStore = useSysConfStore();
/**
 * 全部应用
 */
export const useAllServItemsStore = defineStore("allServItems", () => {

    const allServItemList = reactive<CardFace[]>([]);
    /**
     * 初始化数据，将数据写入对象数组中
     * @param array 数据
     * @param installedItemList 已安装数据列表 
     * @returns 存入数据的对象数组
     */
    const initAllItems = (array: any, installedItemList: CardFace[]) => {
        // 清空原始对象
        clearItems();
        // 组装数据进入对象数组
        for (let i = 0; i < array.length; i++) {
            const item: CardFace = array[i];
            const itemArch: string = item.arch.trim();
            if (sysConfStore.filterFlag && itemArch != sysConfStore.arch) {
                continue;
            }
            item.isInstalled = installedItemList.some((it) => it.name === item.name && it.version === item.version && it.appId === item.appId);
            item.loading = false;
            allServItemList.push(item);
        }
        return allServItemList;
    }
    /**
     * 新增对象
     * @param item 要新增的对象
     */
    const addItem = (item: CardFace) => {
        allServItemList.push(item);
    };

    /**
     * 更新对象的安装状态
     * @param item 要更新的对象
     */
    const updateItemInstallStatus = (item: CardFace) => {
        const index = allServItemList.findIndex((it) => it.name === item.name && it.version === item.version && it.appId === item.appId);
        if (index !== -1) {
            const aItem = allServItemList[index];
            aItem.isInstalled = item.isInstalled;
            allServItemList.splice(index, 1, aItem);
        }
    }
    /**
     * 移除对象
     * @param item 要移除的对象
     */
    const removeItem = (item: CardFace) => {
        const index = allServItemList.findIndex((it) => it.appId === item.appId && it.name === item.name && it.version === item.version);
        if (index !== -1) {
            allServItemList.splice(index, 1);
        }
    };
    /**
     * 清空所有应用对象列表
     */
    const clearItems = () => {
        allServItemList.splice(0, allServItemList.length);
    };
    /**
     * 更新对象的加载状态
     * @param item 要更新的对象
     */
    const updateItemLoadingStatus = (item: CardFace,flag: boolean) => {
        const index = allServItemList.findIndex((it) => it.name === item.name && it.version === item.version && it.appId === item.appId);
        if (index !== -1) {
            const aItem = allServItemList[index];
            aItem.loading = flag;
            allServItemList.splice(index, 1, aItem);
        }
    }
    const getItem = (name: string) => {
        return allServItemList.find((item) => item.name === name);
    };
    const getItemIndex = (name: string) => {
        return allServItemList.findIndex((item) => item.name === name);
    };
    const getItemByName = (name: string) => {
        return allServItemList.find((item) => item.name === name);
    };

    return {
        allServItemList,
        initAllItems,
        addItem,
        updateItemInstallStatus,
        removeItem,
        clearItems,
        updateItemLoadingStatus,
        
        getItem,
        getItemIndex,
        getItemByName,
    };
});