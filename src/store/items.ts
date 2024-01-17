import { defineStore } from "pinia";
import { computed, reactive } from "vue";
import { CardFace } from "@/components/CardFace";

/**
 * 全部应用
 */
export const useAllItemsStore = defineStore("allItems", () => {

    const allItems = reactive<CardFace[]>([]);

    const initAllItems = (array: any, filterFlag: boolean, arch: string) => {
        for (let i = 0; i < array.length; i++) {
            const item: CardFace = array[i];
            const itemArch: string | undefined = item.arch?.trim();
            if (filterFlag && itemArch != arch) {
                continue;
            }
            allItems.push(item);
        }
        return allItems;
    }

    const getItems = () => {
        return allItems;
    };
    const addItem = (item: CardFace) => {
        allItems.push(item);
    };
    const removeItem = (item: CardFace) => {
        allItems.splice(allItems.indexOf(item), 1);
    };
    const clearItems = () => {
        allItems.splice(0, allItems.length);
    };
    const getItem = (name: string) => {
        return allItems.find((item) => item.name === name);
    };
    const getItemIndex = (name: string) => {
        return allItems.findIndex((item) => item.name === name);
    };
    const getItemCount = () => {
        return allItems.length;
    };
    const getItemAt = (index: number) => {
        return allItems[index];
    };
    const getItemByName = (name: string) => {
        return allItems.find((item) => item.name === name);
    };

    return {
        allItems,
        initAllItems,
        getItems,
        addItem,
        removeItem,
        clearItems,
        getItem,
        getItemIndex,
        getItemCount,
        getItemAt,
        getItemByName,
    };
});

/**
 * 已安装的全部应用
 */
export const useInstalledItemsStore = defineStore("installedItems", () => {

    let installedItemList = reactive<CardFace[]>([]);

    const initInstalledItems = (data: any) => {
        const apps = data.split("\n");
        if (apps.length > 1) {
            const header = apps[0].split("[1m[38;5;214m")[1];
            const appIdNum = header.indexOf("appId");
            const nameNum = header.indexOf("name");
            // 第0条是分类项不是应用，需要剔除，最后一行空，也需要剔除
            for (let index = 1; index < apps.length - 1; index++) {
                const element = apps[index];
                const appId = element.substring(appIdNum, nameNum).trim();
                // 去除运行时服务
                if (appId == "org.deepin.Runtime") {
                    continue;
                }
                const items = element.match(/'[^']+'|\S+/g);
                const item: CardFace = {
                    name: items[1] ? items[1] : "-"
                };
                item.appId = appId;
                item.version = items[2];
                item.arch = items[3];
                item.channel = items[4];
                item.module = items[5];
                item.description = items[6];
                item.icon = "";
                installedItemList.push(item);
            }
        }
        return installedItemList;
    }

    const getItems = () => {
        return installedItemList;
    };
    const addItem = (item: CardFace) => {
        installedItemList.push(item);
    };
    const removeItem = (item: CardFace) => {
        installedItemList.splice(installedItemList.indexOf(item), 1);
    };
    const clearItems1 = () => {
        installedItemList.splice(0, installedItemList.length);
    };
    const getItem = (name: string) => {
        return installedItemList.find((item) => item.name === name);
    };
    const getItemIndex = (name: string) => {
        return installedItemList.findIndex((item) => item.name === name);
    };
    const getItemCount = computed(() => {
        return installedItemList.length;
    });
    const getItemAt = (index: number) => {
        return installedItemList[index];
    };
    const getItemByName = (name: string) => {
        return installedItemList.find((item) => item.name === name);
    };

    return {
        installedItemList,
        initInstalledItems,
        getItems,
        addItem,
        removeItem,
        clearItems1,
        getItem,
        getItemIndex,
        getItemCount,
        getItemAt,
        getItemByName,
    };
});

/**
 * 全部应用，当前显示的应用列表
 */
export const useDisplayedItemsStore = defineStore("displayedItems", () => {

    let displayedItemList = reactive<CardFace[]>([]);

    const getItems = () => {
        return displayedItemList;
    };
    const addItem = (item: CardFace) => {
        displayedItemList.push(item);
    };
    const removeItem = (item: CardFace) => {
        displayedItemList.splice(displayedItemList.indexOf(item), 1);
    };
    const clearItems = computed(() => {
        displayedItemList.splice(0, displayedItemList.length);
    });
    const getItem = (name: string) => {
        return displayedItemList.find((item) => item.name === name);
    };
    const getItemIndex = (name: string) => {
        return displayedItemList.findIndex((item) => item.name === name);
    };
    const getItemCount = computed(() => {
        return displayedItemList.length;
    });
    const getItemAt = (index: number) => {
        return displayedItemList[index];
    };
    const getItemByName = (name: string) => {
        return displayedItemList.find((item) => item.name === name);
    };

    return {
        displayedItemList,
        getItems,
        addItem,
        removeItem,
        clearItems,
        getItem,
        getItemIndex,
        getItemCount,
        getItemAt,
        getItemByName,
    };
});