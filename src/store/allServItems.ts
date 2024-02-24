import { defineStore } from "pinia";
import { reactive } from "vue";
import { CardFace } from "@/interface/CardFace";
import { useSystemConfigStore } from "@/store/systemConfig";

const systemConfigStore = useSystemConfigStore();
/**
 * 全部应用
 */
export const useAllServItemsStore = defineStore("allServItems", () => {

    const allServItemList = reactive<CardFace[]>([]);
    /**
     * 初始化数据，将数据写入对象数组中
     * @param array 数据
     * @param installedItemList 已安装数据列表 
     * @returns 存入数据的对象数组
     */
    const initAllItems = (array: any, installedItemList: CardFace[]) => {
        // 清空原始对象
        clearItems();
        // 组装数据进入对象数组
        let list:CardFace[] = array;
        // 添加wps
        const index = list.findIndex((i) => i.appId === "cn.wps.wps-office");
        if (index == -1) {
            const wpsItem: CardFace = {
                "id": "100000",
                "appId": "cn.wps.wps-office",
                "name": "wps-office",
                "version": "11.1.0.10920",
                "description": "WPS Office 2019 for Linux 办公软件，是一款兼容、开放、高效、安全并极具中文本土化优势的办公软件。",
                "arch": "x86_64",
                "icon": "https://ee.wpscdn.cn/wpscn/images/icon/wps-default.57da6711.svg",
            }
            list.push(wpsItem);
        }
        // 将请求的数据条数记录到系统参数store中
        systemConfigStore.changeLinglongCount(list.length);
        // 过滤无图标程序
        if (!systemConfigStore.isShowNoIcon) {
            list = list.filter((i) => "https://mirror-repo-linglong.deepin.com/icon/application-x-executable.svg" != i.icon);
        }
        // 排序
        list.sort((a, b) => {
            const nameA = a.name.toLowerCase(); // 将 name 转换为小写
            const nameB = b.name.toLowerCase(); // 将 name 转换为小写
            if (nameA < nameB) {
                return -1;
            }
            if (nameA > nameB) {
                return 1;
            }
            return 0;
        })
        // 过滤非当前架构程序
        if (systemConfigStore.isShowDisArch) {
            for (let i = 0; i < list.length; i++) {
                const item: CardFace = list[i];
                item.isInstalled = installedItemList.some((it) => it.name === item.name && it.appId === item.appId);
                item.loading = false;
                allServItemList.push(item);
            }
        } else {
            for (let i = 0; i < list.length; i++) {
                const item: CardFace = list[i];
                const itemArch: string = item.arch.trim();
                if (itemArch == systemConfigStore.arch) {
                    item.isInstalled = installedItemList.some((it) => it.name === item.name && it.appId === item.appId);
                    item.loading = false;
                    allServItemList.push(item);
                }
            }
        }
        return allServItemList;
    }
    /**
     * 新增对象
     * @param item 要新增的对象
     */
    const addItem = (item: CardFace) => {
        allServItemList.push(item);
    };

    /**
     * 更新对象的安装状态
     * @param item 要更新的对象
     */
    const updateItemInstallStatus = (item: CardFace) => {
        const index = allServItemList.findIndex((it) => it.name === item.name && it.appId === item.appId);
        if (index !== -1) {
            const aItem = allServItemList[index];
            aItem.isInstalled = item.isInstalled;
            allServItemList.splice(index, 1, aItem);
        }
    }
    /**
     * 更新对象的加载状态
     * @param item 要更新的对象
     */
    const updateItemLoadingStatus = (item: CardFace,flag: boolean) => {
        const index = allServItemList.findIndex((it) => it.name === item.name && it.version === item.version && it.appId === item.appId);
        if (index !== -1) {
            const aItem = allServItemList[index];
            aItem.loading = flag;
            allServItemList.splice(index, 1, aItem);
        }
    }
    /**
     * 清空所有应用对象列表
     */
    const clearItems = () => {
        allServItemList.splice(0, allServItemList.length);
    };

    return {
        allServItemList,
        initAllItems,
        addItem,
        updateItemInstallStatus,
        updateItemLoadingStatus,
        clearItems,
    };
});