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

    // const initUpdateItems = async () => {
    //     updateItemList.splice(0, updateItemList.length); // 清空列表数据
    //     const installedItemList: CardFace[] = installedItemsStore.installedItemList;
    //     for (const item of installedItemList) {
    //         const appId: string | undefined = item.appId;
    //         if (appId) {
    //             console.log('appId',appId);
    //             // 延时500毫秒进入
    //             await new Promise(resolve => {
    //                 ipcRenderer.send("command", { command: "ll-cli query ".concat(appId) });
    //                 ipcRenderer.once('command-result', (_event: any, res: any) => {
    //                     const command: string = res.param.command;
    //                     if (command.startsWith('ll-cli query') && 'stdout' == res.code) {
    //                         const apps: string[] = (res.result as string).split('\n');
    //                         if(apps.length > 2) {
    //                             console.log('apps',apps);
    //                             for (let index = 2; index < apps.length - 1; index++){
    //                                 const card: CardFace = string2card(apps[index]);
    //                                 const version = item.version;
    //                                 if (appId == card.appId && version && card.version && hasUpdateVersion(version,card.version)) {
    //                                     updateItemList.push(item);
    //                                     return;
    //                                 }
    //                             }
    //                         }
    //                     }
    //                 });
    //             });
    //         }
    //     }
    //     return updateItemList;
    // }

    const fetchAndUpdateItem = async (item: CardFace) => {
        const { appId, version } = item;
        if (!appId || !version) {
            return;
        }
        return new Promise((resolve) => {
            console.log('appId', appId);
            ipcRenderer.send("command", { command: `ll-cli query ${appId}` });
            ipcRenderer.once('command-result', (_event: any, res: any) => {
                const command: string = res.param.command;
                if (command.startsWith('ll-cli query') && 'stdout' == res.code) {
                    const apps: string[] = (res.result as string).split('\n');
                    if (apps.length > 2) {
                        console.log('apps', apps);
                        for (let index = 2; index < apps.length - 1; index++) {
                            const card: CardFace | null = string2card(apps[index]);
                            if (card && appId == card.appId && card.version && hasUpdateVersion(version, card.version)) {
                                resolve(item);
                                return;
                            }
                        }
                    }
                }
                resolve(null);
            });
        });
    };

    const initUpdateItems = async () => {
        clearItems(); // 清空列表数据
        const installedItemList: CardFace[] = installedItemsStore.installedItemList;
        const promises = installedItemList.map(fetchAndUpdateItem);
        const results = await Promise.all(promises);
        // 过滤掉 null 值，保留有更新的项
        for (let index = 0; index < results.length; index++) {
            const element = results[index];
            if (element) addItem(element as CardFace);
        }
    };
    /**
     * 新增对象
     * @param item 要新增的对象
     */
    const addItem = (item: CardFace) => {
        updateItemList.push(item);
    };
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