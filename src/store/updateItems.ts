import { defineStore } from "pinia";
import { ref } from "vue";
import { CardFace } from "@/interface";

/**
 * 可更新的全部应用
 */
export const useUpdateItemsStore = defineStore("updateItems", () => {

    let updateItemList = ref<CardFace[]>([]);
    /**
     * 新增对象
     * @param item 要新增的对象
     */
    const addItem = (item: CardFace) => {
        updateItemList.value.push(item);
    };
    /**
     * 从对象数组中移除对象
     * @param item 要移除的对象
     */
    const removeItem = (item: CardFace) => {
        const index = updateItemList.value.findIndex((i) => i.appId === item.appId && i.name === item.name && i.version === item.version);
        if (index !== -1) {
            updateItemList.value.splice(index, 1);
        }
    };
    /**
     * 清空所有应用对象列表
     */
    const clearItems = () => {
        updateItemList.value.splice(0, updateItemList.value.length);
    };

    return {
        updateItemList,
        addItem,
        removeItem,
        clearItems,
    };

});