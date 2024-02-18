import { defineStore } from "pinia";
import { ref } from "vue";
import { InstalledEntity } from "@/interface/InstalledEntity";

/**
 * 已安装的全部应用
 */
export const useInstallingItemsStore = defineStore("installingItems", () => {

    let installingItemList = ref<InstalledEntity[]>([]);
    
    /**
     * 新增对象
     * @param item 要新增的对象
     */
    const addItem = (item: InstalledEntity) => {
        installingItemList.value.push(item);
    };
    /**
     * 从对象数组中移除对象
     * @param item 要移除的对象
     */
    const removeItem = (item: InstalledEntity) => {
        const index = installingItemList.value.findIndex((i) => i.appId === item.appId && i.name === item.name && i.version === item.version);
        if (index !== -1) {
            installingItemList.value.splice(index, 1);
        }
    };
    
    return {
        installingItemList,
        addItem,
        removeItem,
    };
});