import { defineStore } from "pinia";
import { ref } from "vue";
import { CardFace } from "@/interface";

/**
 * 全部应用
 */
export const useAllAppItemsStore = defineStore("allAppItems", () => {

    const allAppItemList = ref<CardFace[]>([]);
    
    /**
     * 新增对象
     * @param item 要新增的对象
     */
    const addItem = (item: CardFace) => {
        allAppItemList.value.push(item);
    };

    /**
     * 更新对象的安装状态
     * @param item 要更新的对象
     */
    const updateItemInstallStatus = (item: CardFace) => {
        const index = allAppItemList.value.findIndex((it) => it.appId === item.appId);
        if (index !== -1) {
            const aItem = allAppItemList.value[index];
            aItem.isInstalled = item.isInstalled;
            allAppItemList.value.splice(index, 1, aItem);
        }
    }

    /**
     * 更新对象的加载状态
     * @param item 要更新的对象
     */
    const updateItemLoadingStatus = (item: CardFace,flag: boolean) => {
        const index = allAppItemList.value.findIndex((it) => it.appId === item.appId);
        if (index !== -1) {
            const aItem = allAppItemList.value[index];
            aItem.loading = flag;
            allAppItemList.value.splice(index, 1, aItem);
        }
    }

    /**
     * 清空所有应用对象列表
     */
    const clearItems = () => {
        allAppItemList.value.splice(0, allAppItemList.value.length);
    };

    return {
        allAppItemList,
        addItem,
        updateItemInstallStatus,
        updateItemLoadingStatus,
        clearItems,
    };
});