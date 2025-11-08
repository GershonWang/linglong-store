/**
 * Store 公共逻辑基类
 * 提取多个 Store 中重复的逻辑
 */

import { Ref } from 'vue';
import { InstalledEntity } from '@/interface';

/**
 * 生成项目的唯一键
 */
export function getItemKey(item: InstalledEntity): string {
    return `${item.appId}-${item.version}-${item.module || ''}`;
}

/**
 * 创建基础 Store 操作方法
 * @param itemList Store 中的项目列表
 * @returns 基础操作方法集合
 */
export function createBaseStoreActions(itemList: Ref<InstalledEntity[]>) {
    /**
     * 更新对象的安装状态
     */
    const updateItemInstallStatus = (item: InstalledEntity, flag: boolean) => {
        const key = getItemKey(item);
        const index = itemList.value.findIndex((it) => getItemKey(it) === key);
        if (index !== -1) {
            const aItem = { ...itemList.value[index] };
            aItem.isInstalled = flag;
            itemList.value.splice(index, 1, aItem);
        }
    };

    /**
     * 更新对象的加载状态
     */
    const updateItemLoadingStatus = (item: InstalledEntity, flag: boolean) => {
        const key = getItemKey(item);
        const index = itemList.value.findIndex((it) => getItemKey(it) === key);
        if (index !== -1) {
            const aItem = { ...itemList.value[index] };
            aItem.loading = flag;
            itemList.value.splice(index, 1, aItem);
        }
    };

    /**
     * 从对象数组中移除对象
     */
    const removeItem = (item: InstalledEntity) => {
        const key = getItemKey(item);
        const index = itemList.value.findIndex((i) => getItemKey(i) === key);
        if (index !== -1) {
            itemList.value.splice(index, 1);
        }
    };

    /**
     * 新增对象
     */
    const addItem = (item: InstalledEntity) => {
        itemList.value.push(item);
    };

    /**
     * 清空所有应用对象列表
     */
    const clearItems = () => {
        itemList.value.splice(0, itemList.value.length);
    };

    /**
     * 根据 appId 查找项目
     */
    const findItemByAppId = (appId: string): InstalledEntity | undefined => {
        return itemList.value.find(item => item.appId === appId);
    };

    /**
     * 根据键查找项目
     */
    const findItemByKey = (key: string): InstalledEntity | undefined => {
        return itemList.value.find(item => getItemKey(item) === key);
    };

    /**
     * 批量更新项目
     */
    const updateItems = (updater: (item: InstalledEntity) => InstalledEntity | null) => {
        itemList.value = itemList.value.map(item => {
            const updated = updater(item);
            return updated !== null ? updated : item;
        }).filter(item => item !== null) as InstalledEntity[];
    };

    return {
        updateItemInstallStatus,
        updateItemLoadingStatus,
        removeItem,
        addItem,
        clearItems,
        findItemByAppId,
        findItemByKey,
        updateItems,
    };
}

