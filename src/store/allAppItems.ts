import { defineStore } from "pinia";
import { ref } from "vue";
import { InstalledEntity } from "@/interface";
import { createBaseStoreActions } from "./baseStore";

/**
 * 全部应用
 */
export const useAllAppItemsStore = defineStore("allAppItems", () => {

    const allAppItemList = ref<InstalledEntity[]>([]);
    
    // 使用公共 Store 逻辑
    const baseActions = createBaseStoreActions(allAppItemList);

    return {
        allAppItemList,
        ...baseActions,
    };
});