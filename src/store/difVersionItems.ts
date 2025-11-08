import { defineStore } from "pinia";
import { ref } from "vue";
import { compareVersions } from "@/util/checkVersion";
import { InstalledEntity } from "@/interface";
import { getSearchAppVersionList } from "@/api";
import { logger } from "@/util/logger";
import { createBaseStoreActions } from "./baseStore";
import { useInstalledItemsStore } from "@/store/installedItems";
import { useSystemConfigStore } from "@/store/systemConfig";

// 使用依赖注入模式，在需要时获取 Store 实例（延迟初始化）
const getInstalledItemsStore = () => useInstalledItemsStore();
const getSystemConfigStore = () => useSystemConfigStore();

/**
 * 不同版本列表
 */
export const useDifVersionItemsStore = defineStore("difVersionItems", () => {

    let difVersionItemList = ref<InstalledEntity[]>([]);

    /**
     * 初始化已安装程序数组
     * @param data 待处理的数据
     * @returns 将数据放入后的对象数组
     */
    const initDifVersionItems = async (data: any[], appId: string) => {
        // 清空原始对象
        difVersionItemList.value.splice(0, difVersionItemList.value.length);
        // 传入的data为空直接返回
        if (data.length < 1) {
            return difVersionItemList;
        }
        // 获取系统配置
        const systemConfigStore = getSystemConfigStore();
        const arch = systemConfigStore.arch;
        const repoName = systemConfigStore.defaultRepoName;
        // 赋值默认属性
        data.forEach(item => {
            item.appId = item.id ? item.id : item.appid ? item.appid : item.appId; // 设定appId
            item.arch = typeof item.arch === 'string' ? item.arch : Array.isArray(item.arch) ? item.arch[0] : ''; // 设定arch架构
            item.size = item.size ? item.size.toString() : '0'; // 设定文件大小
            item.repoName = repoName; // 设定仓库源
            item.categoryName = '其他'; // 设定分类名称
            item.installCount = 0; // 安装次数
            item.uninstallCount = 0; // 卸载次数
            item.isInstalled = false; // 默认未安装
            item.loading = false; // 默认未加载
        });
        // 过滤不同appId的数据
        data = data.filter(item => item.appId === appId);
        if (data.length < 1) {
            return difVersionItemList;
        }
        // 2.填充已安装应用到查询结果，然后判断数组是否为空
        const installedItemsStore = getInstalledItemsStore();
        for (let item of installedItemsStore.installedItemList) {
            if (item.appId == appId) {
                const idx = data.findIndex(it => it.version === item.version && it.module === item.module);
                if (idx >= 0) {
                    // 如果已安装的版本在查询结果中存在，则更新查询结果的安装状态
                    data[idx].isInstalled = true;
                } else {
                    // 如果已安装的版本不在查询结果中，则添加到查询结果中
                    item.arch = item.arch ? item.arch : arch; // 设置架构
                    item.kind = item.kind ? item.kind : '本地安装'; // 设置类型
                    item.categoryName = '其他'; // 设置分类名称
                    item.installCount = 1; // 安装次数
                    item.uninstallCount = 0; // 卸载次数
                    item.isInstalled = true; // 已安装状态
                    data.push(item);
                }
            }
        }
        // data数组中当同版本号存在两个及以上的记录时，保留module为binary的记录，其余module为runtime的记录删除，也就是binary优先级比较高
        const uniqueData = new Map<string, InstalledEntity>();
        data.forEach(item => {
            const key = `${item.appId}-${item.name}-${item.version}`;
            if (!uniqueData.has(key) || (item.module === 'binary' && uniqueData.get(key)?.module !== 'binary')) {
                uniqueData.set(key, item);
            }
        });
        data = Array.from(uniqueData.values());
        // 获取服务器端数据
        try {
            let response = await getSearchAppVersionList({ appId, arch, repoName });
            if (response.code == 200) {
                let result = response.data as unknown as InstalledEntity[];
                data.forEach(item => {
                    let app = result.find(it => it.appId === item.appId && it.version === item.version && it.module === item.module && it.channel === item.channel);
                    item.installCount = app ? app.installCount : 0;
                    item.uninstallCount = app ? app.uninstallCount : 0;
                    item.createTime = app ? app.createTime : '';
                });
            }
        } catch (error) {
            logger.error("获取不同版本应用列表失败:", error);
        }
        // 对数据进行排序，按照版本号降序排列
        difVersionItemList.value = data.sort((a, b) => compareVersions(b.version, a.version));
        return difVersionItemList;
    }

    // 使用公共 Store 逻辑
    const baseActions = createBaseStoreActions(difVersionItemList);

    return {
        difVersionItemList,
        initDifVersionItems,
        ...baseActions,
    };
});