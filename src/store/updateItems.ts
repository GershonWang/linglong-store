import { defineStore } from "pinia";
import { ref } from "vue";
import { InstalledEntity } from "@/interface";
import { useInstalledItemsStore } from "@/store/installedItems";
import { getAppDetails } from "@/api";
import { handleError, ErrorLevel } from '@/util/errorHandler';
import { createBaseStoreActions } from "./baseStore";

const installedItemsStore = useInstalledItemsStore();

/**
 * 可更新的全部应用
 */
export const useUpdateItemsStore = defineStore("updateItems", () => {

    let updateItemList = ref<InstalledEntity[]>([]);

    /**
     * 初始化更新列表
     */
    const initUpdateItems = async (data: string) => {
        const datas: any[] = data.trim() ? JSON.parse(data.trim()) : [];
        if (datas.length < 1) {
            updateItemList.value.splice(0, updateItemList.value.length); // 清空更新列表
            return;
        }
        let addedItems: InstalledEntity[] = [];
        let missingInfoItems: InstalledEntity[] = [];
        
        datas.forEach(item => {
            const { id, old_version, new_version } = item;
            const thisItem = installedItemsStore.installedItemList.find(installedItem => installedItem.appId == id);
            if (thisItem) {
                // 复制对象，避免修改原始数据
                const updateItem = { ...thisItem };
                updateItem.oldVersion = old_version; // 设置旧版本号
                updateItem.newVersion = new_version; // 更新版本号
                addedItems.push(updateItem);
                
                // 检查是否缺少图标、分类等信息
                if (!updateItem.icon || !updateItem.categoryName || updateItem.categoryName === '其他' || !updateItem.devName) {
                    missingInfoItems.push(updateItem);
                }
            } else {
                // 如果从已安装列表中找不到，创建一个基础对象，后续通过API获取详细信息
                const newItem: InstalledEntity = {
                    appId: id,
                    name: id,
                    arch: '',
                    base: '',
                    channel: '',
                    kind: 'app',
                    module: '',
                    runtime: '',
                    size: '0',
                    version: old_version,
                    description: '',
                    schema_version: '',
                    command: '',
                    install_time: '',
                    permissions: '',
                    extensions: '',
                    oldVersion: old_version,
                    newVersion: new_version,
                    repoName: '',
                    isInstalled: true,
                    loading: false,
                    categoryName: '其他',
                };
                addedItems.push(newItem);
                missingInfoItems.push(newItem);
            }
        });
        
        // 如果更新列表为空，则直接赋值
        if (updateItemList.value.length < 1) {
            updateItemList.value = addedItems as InstalledEntity[]; 
        } else {
            // 更新列表和新增列表获取交集数据
            const newList = updateItemList.value.filter(aItem => addedItems.some(bItem => bItem.appId === aItem.appId));
            updateItemList.value = newList; // 交集赋值给更新列表，这样更新列表只有本次继续更新的应用
            addedItems.forEach(bItem => {
                if (!newList.some(aItem => bItem.appId === aItem.appId)) {
                    updateItemList.value.push(bItem);
                }
            });
        }
        
        // 如果有缺少信息的项目，调用API获取详细信息
        if (missingInfoItems.length > 0) {
            try {
                const response = await getAppDetails(missingInfoItems);
                if (response.code == 200) {
                    const details: InstalledEntity[] = response.data as unknown as InstalledEntity[];
                    details.forEach((detailItem: InstalledEntity) => {
                        const idx = updateItemList.value.findIndex(it => it.appId === detailItem.appId);
                        if (idx !== -1) {
                            // 保留更新相关的版本信息，更新其他信息
                            const existingItem = updateItemList.value[idx];
                            const updatedItem = { 
                                ...existingItem, 
                                ...detailItem,
                                oldVersion: existingItem.oldVersion,
                                newVersion: existingItem.newVersion,
                            };
                            updateItemList.value.splice(idx, 1, updatedItem);
                        }
                    });
                } else {
                    handleError(`获取更新应用详情失败: ${response.msg}`, {
                        level: ErrorLevel.ERROR,
                        logToMain: true,
                        showMessage: false,
                    });
                }
            } catch (error) {
                handleError(`获取更新应用详情异常: ${error}`, {
                    level: ErrorLevel.ERROR,
                    logToMain: true,
                    showMessage: false,
                });
            }
        }
    }
    // 使用公共 Store 逻辑
    const baseActions = createBaseStoreActions(updateItemList);
    
    /**
     * 从对象数组中移除对象（重写，只根据 appId 匹配）
     */
    const removeItem = (item: InstalledEntity) => {
        const index = updateItemList.value.findIndex((i) => i.appId === item.appId);
        if (index !== -1) {
            updateItemList.value.splice(index, 1);
        }
    };

    return {
        updateItemList,
        initUpdateItems,
        addItem: baseActions.addItem,
        removeItem,
        clearItems: baseActions.clearItems,
        updateItemLoadingStatus: baseActions.updateItemLoadingStatus,
        updateItemInstallStatus: baseActions.updateItemInstallStatus,
    };

});