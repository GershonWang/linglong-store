import { defineStore } from "pinia";
import { reactive } from "vue";
import { ipcRenderer } from "electron";
import { CardFace } from "@/interface/CardFace";
import string2card from "@/util/string2card";
import hasUpdateVersion from "@/util/checkVersion";
import { useInstalledItemsStore } from "@/store/installedItems";

const installedItemsStore = useInstalledItemsStore();
/**
 * 可更新的全部应用
 */
export const useUpdateItemsStore = defineStore("updateItems", () => {

    let updateItemList = reactive<CardFace[]>([]);

    const initUpdateItems = () => {
        updateItemList.splice(0, updateItemList.length); // 清空列表数据
        const installedItemList: CardFace[] = installedItemsStore.installedItemList;
        for (const item of installedItemList) {
            const appId = item.appId;
            const version = item.version;
            ipcRenderer.send("command", { command: "ll-cli query " + appId });
            ipcRenderer.on('command-result', (_event: any, res: any) => {
                const command: string = res.param.command;
                if (command.startsWith('ll-cli query') && 'stdout' == res.code) {
                    const data = res.result;
                    const apps: string[] = data.split('\n');
                    if(apps.length > 2) {
                        for (let index = 2; index < apps.length - 1; index++){
                            const element: string = apps[index];
                            const card: CardFace = string2card(element);
                            if (appId == card.appId && version && card.version && hasUpdateVersion(version,card.version)) {
                                updateItemList.push(card);
                                return;
                            }
                        }
                    }
                }
            });
        }
        return updateItemList;
    }

    /**
     * 从对象数组中移除对象
     * @param item 要移除的对象
     */
    const removeItem = (item: CardFace) => {
        const index = updateItemList.findIndex((i) => i.appId === item.appId && i.name === item.name && i.version === item.version);
        if (index !== -1) {
            updateItemList.splice(index, 1);
        }
    };
    /**
     * 清空所有应用对象列表
     */
    const clearItems = () => {
        updateItemList.splice(0, updateItemList.length);
    };

    return {
        updateItemList,
        initUpdateItems,
        removeItem,
        clearItems,
    };

});