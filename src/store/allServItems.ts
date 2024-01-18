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
        for (let i = 0; i < array.length; i++) {
            const item: CardFace = array[i];
            const itemArch: string | undefined = item.arch?.trim();
            if (sysConfStore.filterFlag && itemArch != sysConfStore.arch) {
                continue;
            }
            item.isInstalled = installedItemList.some((installedItem) => installedItem.name === item.name && installedItem.version === item.version && installedItem.appId === item.appId);
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

    const removeItem = (item: CardFace) => {
        const index = allServItemList.findIndex((i) => i.appId === item.appId && i.name === item.name && i.version === item.version);
        if (index !== -1) {
            allServItemList.splice(index, 1);
        }
    };
    const clearItems = () => {
        allServItemList.splice(0, allServItemList.length);
    };
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
        getItem,
        getItemIndex,
        getItemByName,
    };
});