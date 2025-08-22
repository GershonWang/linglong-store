import { ref } from "vue";
import { defineStore } from "pinia";
import { InstalledEntity } from "@/interface";
import { useSystemConfigStore } from "@/store/systemConfig";
import { getAppDetails } from "@/api";
import { ipcRenderer } from "electron";

const systemConfigStore = useSystemConfigStore();

/**
 * 已安装的全部应用
 */
export const useInstalledItemsStore = defineStore("installedItems", () => {
    let installedItemList = ref<InstalledEntity[]>([]);
    // 添加全局重试计数器和上次请求标识
    const retryCount = ref(0);
    const lastRequestHash = ref('');

    /**
     * 初始化已安装程序数组(1.4以后的版本)
     * @param data 待处理的数据
     * @returns 将数据放入后的对象数组
     */
    const initInstalledItems = async (data: string) => {
        // 记录新增的列表
        let addedItems: InstalledEntity[] = [];
        // 记录移除的列表
        let removedItems: InstalledEntity[] = [];
        // 字符串转对象数组
        const datas: any[] = data.trim() ? JSON.parse(data.trim()) : [];
        // 对象数组传入是空的时候，处理返回
        if (datas.length < 1) {
            removedItems = [...installedItemList.value]; // 全部被移除
            clearItems(); // 清空已安装列表
            return { installedItemList, addedItems, removedItems };
        }
        // 拆解并处理数据
        datas.forEach(item => {
            item.appId = item.id ? item.id : item.appid ? item.appid : item.appId; // 设定appId
            item.arch = typeof item.arch === 'string' ? item.arch : Array.isArray(item.arch) ? item.arch[0] : ''; // 设定arch架构
            item.size = item.size ? item.size.toString() : '0'; // 设定文件大小
            item.repoName = systemConfigStore.defaultRepoName; // 设定仓库源
            item.categoryName = '其他'; // 设定分类名称
            item.installCount = 0; // 安装次数
            item.uninstallCount = 0; // 卸载次数
            item.isInstalled = true; // 默认已安装
            item.loading = false; // 默认未加载
        });
        
        // 如果已安装列表不为空，则进行对比
        if (installedItemList.value.length > 0) {
            // 获取原已安装列表中和当前查询的列表的交集元素集合
            const mixedList = installedItemList.value.filter(aItem => datas.some(bItem => bItem.appId === aItem.appId && bItem.version === aItem.version));
            // 获取原已安装列表中不存在当前查询列表元素的元素，找出后保存在被移除的元素集合中
            removedItems = installedItemList.value.filter(aItem => !datas.some(bItem => bItem.appId === aItem.appId && bItem.version === aItem.version));
            // 获取当前查询列表中不存在原已安装列表中元素的元素，找出后保存到新增元素集合中
            addedItems = datas.filter(bItem => !installedItemList.value.some(aItem => bItem.appId === aItem.appId && bItem.version === aItem.version));
            // 将新增元素集合合并到已安装列表变量中
            installedItemList.value = [...mixedList, ...addedItems];
        } else { // 如果已安装列表为空，则直接赋值
            installedItemList.value = datas as InstalledEntity[];
            addedItems = [...installedItemList.value];
        }

        // 只在有新增时才获取新增应用详情
        const detailItems: InstalledEntity[] = [];
        if (addedItems.length > 0) {
            detailItems.push(...addedItems);
        }
        // 获取已安装列表中元素的categoryName为“其他”的项，如果集合不为空则调用后台接口查询详情填充
        const otherItems = installedItemList.value.filter(item => item.categoryName === '其他' || !item.devName);
        if (otherItems.length > 0) {
            detailItems.push(...otherItems);
        }
        
        if (detailItems.length > 0) {
            // 生成请求内容哈希值，用于检测内容变化
            const currentHash = JSON.stringify(detailItems.map(item => `${item.appId}-${item.version}`));
            // 如果内容变化则重置计数器
            if (currentHash !== lastRequestHash.value) {
                retryCount.value = 0;
                lastRequestHash.value = currentHash;
            }
            // 超过最大重试次数则停止请求
            if (retryCount.value <= 3) {
                try {
                    const response = await getAppDetails(detailItems);
                    if (response.code == 200) {
                        const details: InstalledEntity[] = response.data as unknown as InstalledEntity[];
                        let hasUpdates = false;
                
                        details.forEach((item: InstalledEntity) => {
                            const idx = installedItemList.value.findIndex(it => it.appId == item.appId && it.version == item.version);
                            if (idx !== -1 && item.kind) {
                                const oldItem = installedItemList.value[idx];
                                // 检查是否有实际更新
                                if (!oldItem.devName || oldItem.categoryName === '其他') {
                                    hasUpdates = true;
                                }
                                // 更新数据
                                const updatedItem = { ...oldItem, ...item };
                                installedItemList.value.splice(idx, 1, updatedItem);
                            }
                        });
                
                        // 筛选仍需要更新的项
                        const stillNeedUpdate = detailItems.filter(item => {
                            const updatedItem = installedItemList.value.find(it => it.appId === item.appId && it.version === item.version);
                            return !updatedItem || !updatedItem.devName || updatedItem.categoryName === '其他';
                        });
                
                        // 如果有更新则重置重试计数，否则增加计数
                        if (hasUpdates) {
                            retryCount.value++;
                        } else {
                            retryCount.value = 0;
                        }
                    } else {
                        retryCount.value++;
                        ipcRenderer.send('logger', 'error', `获取应用详情失败: ${response.msg}, 重试次数: ${retryCount.value}`);
                    }
                } catch (error) {
                    retryCount.value++;
                    ipcRenderer.send('logger', 'error', `获取应用详情异常: ${error}, 重试次数: ${retryCount.value}`);
                }
            } else {
                ipcRenderer.send('logger', 'warn', `已连续3次请求应用详情失败`);
            }
        }
        
        // 返回结果
        return { installedItemList, addedItems, removedItems };
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
        const index = installedItemList.value.findIndex((i) => i.appId === item.appId && i.version === item.version && i.module === item.module);
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
        const index = installedItemList.value.findIndex((it) => it.appId === item.appId && it.module === item.module && it.version === item.version);
        if (index !== -1) {
            const aItem = installedItemList.value[index];
            aItem.loading = flag;
            installedItemList.value.splice(index, 1, aItem);
        }
    }
    
    return {
        installedItemList,
        initInstalledItems,
        addItem,
        removeItem,
        clearItems,
        updateItemLoadingStatus,
    };
},{
    persist: {
        key: "installedItems",
        storage: localStorage,
        paths: ["installedItemList"],
    },
});