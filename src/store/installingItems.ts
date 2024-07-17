import { defineStore } from "pinia";
import { ref } from "vue";
import { InstalledEntity } from "@/interface";

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
        item.schedule = "-";
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
    /**
     * 更新对象的加载进度
     * @param item 要更新的对象
     */
    const updateItemSchedule = (item: InstalledEntity, schedule: string) => {
        const index = installingItemList.value.findIndex(it => it.name === item.name && it.version === item.version && it.appId === item.appId);
        if (index !== -1) {
            const aItem = installingItemList.value[index];
            aItem.schedule = schedule;
            installingItemList.value.splice(index, 1, aItem);
        }
    }

    return {
        installingItemList,
        addItem,
        removeItem,
        updateItemSchedule,
    };
});