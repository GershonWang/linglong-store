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
            if (element.appId == 'linux.qq.com' || element.appId == 'com.jetbrains.intellij-idea-ultimate') {
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