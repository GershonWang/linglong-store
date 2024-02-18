import { defineStore } from "pinia";
import { ref } from "vue";
import { InstalledEntity } from "@/interface/InstalledEntity";
import { useAllServItemsStore } from "@/store/allServItems";
import { CardFace } from "@/interface/CardFace";

const allServItemsStore = useAllServItemsStore();

export const useWelcomeItemsStore = defineStore("welcomeItems", () => {

    let welcomeItems = ref<InstalledEntity[]>([]);

    /**
     * 初始化已安装程序数组
     * @param data 待处理的数据
     * @returns 将数据放入后的对象数组
     */
    const initWelcomeItems = () => {
        // 当对象存在数据时，直接返回，不进行后续得初始化操作
        if (welcomeItems.value.length > 0) {
            return;
        }
        const allItems = allServItemsStore.allServItemList;
        for (let index = 0; index < allItems.length; index++) {
            const element: CardFace = allItems[index];
            const installedEntity: InstalledEntity = {
                appId: element.appId,
                arch: element.arch,
                channel: element.channel ? element.channel : '',
                description: element.description ? element.description : '',
                icon: element.icon ? element.icon : '',
                kind: "",
                module: element.module ? element.module : '',
                name: element.name,
                repoName: "",
                runtime: "",
                size: "",
                uabUrl: "",
                user: "",
                version: element.version,
                isInstalled: false,
                loading: false
            }
            if (element.appId == 'linux.qq.com' || element.appId == 'com.jetbrains.intellij-idea-ultimate' || element.appId == 'io.github.fsearch' || element.appId == 'com.qq.wemeet'
                || element.appId == 'cn.google.chrome' || element.appId == 'com.visualstudio.code' || element.appId == 'com.qq.music' || element.appId == 'net.supertuxkart'
                || element.appId == 'com.qianxin.browser-stable' || element.appId == 'cc.modao.mockitt') {
                welcomeItems.value.push(installedEntity);
            }
        }
        return welcomeItems;
    }

    return {
        welcomeItems,
        initWelcomeItems
    }

}, { persist: true });