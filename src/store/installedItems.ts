import { defineStore } from "pinia";
import { ref } from "vue";
import string2card from "@/util/string2card";
import { CardFace,InstalledEntity } from "@/interface";
import { useSystemConfigStore } from "@/store/systemConfig";
import { getAppDetails } from "@/api/server";

const systemConfigStore = useSystemConfigStore();
/**
 * 已安装的全部应用
 */
export const useInstalledItemsStore = defineStore("installedItems", () => {

    let installedItemList = ref<InstalledEntity[]>([]);
    /**
     * 初始化已安装程序数组(1.4以前的版本)
     * @param data 待处理的数据
     * @returns 将数据放入后的对象数组
     */
    const initInstalledItemsOld = (data: string) => {
        clearItems(); // 清空已安装列表
        const apps: string[] = data.split('\n');
        if (apps.length > 2) {
            for (let index = 1; index < apps.length - 1; index++) {
                const card: CardFace | null = string2card(apps[index]);
                if (card) {
                    addItem(card as InstalledEntity);
                }
            }
        }
    }
    /**
     * 初始化已安装程序数组(1.4以后的版本)
     * @param data 待处理的数据
     * @returns 将数据放入后的对象数组
     */
    const initInstalledItems = async (data: string) => {
        clearItems(); // 清空已安装列表
        installedItemList.value = data.trim() ? JSON.parse(data.trim()) : [];
        if (installedItemList.value.length > 0 && !systemConfigStore.isShowBaseService) {
            installedItemList.value = installedItemList.value.filter((item: InstalledEntity) => item.kind == "app")
        }
        await getAppDetails(installedItemList.value).then((res) => {
            if(res.code == 200) {
                installedItemList.value = res.data as unknown as InstalledEntity[];
            } else {
                console.log(res.msg);
            }
        })
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
        initInstalledItemsOld,
        initInstalledItems,
        updateInstalledItemsIcons,
        addItem,
        removeItem,
        clearItems,
        updateItemLoadingStatus,
    };
});