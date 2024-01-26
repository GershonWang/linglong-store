<template>
    <div class="container">
        <div class="card_container" v-if="updateItemsStore.updateItemList && updateItemsStore.updateItemList.length > 0">
            <div class="card_items" v-for="(item, index) in updateItemsStore.updateItemList" :key="index">
                <updateCard :name="item.name" :version="item.version" :description="item.description" :arch="item.arch"
                    :isInstalled="true" :appId="item.appId" :icon="item.icon" :loading="item.loading" />
            </div>
        </div>
        <div class="card_container" v-else>
            <div style="position: absolute;left: 50%;transform: translate(-50%);text-align: center;">
                <h1>暂无可更新程序</h1>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import { onBeforeUnmount, onMounted } from "vue";
import updateCard from "@/components/updateCard.vue";
import { ipcRenderer } from "electron";
import string2card from "@/util/string2card";
import hasUpdateVersion from "@/util/checkVersion";
import { CardFace } from "@/interface/CardFace";
import { useAllServItemsStore } from "@/store/allServItems";
import { useInstalledItemsStore } from "@/store/installedItems";
import { useUpdateItemsStore } from "@/store/updateItems";

const allServItemsStore = useAllServItemsStore();
const installedItemsStore = useInstalledItemsStore();
const updateItemsStore = useUpdateItemsStore();
// 监听命令事件
const commandResult = (_event: any, res: any) => {
    const command: string = res.param.command;
    const appId: string = res.param.appId;
    const version: string = res.param.version;
    if (command.startsWith('ll-cli query') && 'stdout' == res.code) {
        const apps: string[] = (res.result as string).split('\n');
        if (apps.length > 2) {
            for (let index = 2; index < apps.length - 1; index++) {
                const card: CardFace | null = string2card(apps[index]);
                if (card && appId == card.appId && card.version && hasUpdateVersion(version, card.version)) {
                    // 从所有程序列表中捞取程序图标icon
                    const findItem = allServItemsStore.allServItemList.find(it => it.appId == appId);
                    if (findItem) {
                        card.icon = findItem.icon;
                    }
                    updateItemsStore.addItem(card);
                    return;
                }
            }
        }
    }
}
// 页面打开时执行
onMounted(() => {
    updateItemsStore.clearItems(); // 清空列表数据
    const installedItemList: CardFace[] = installedItemsStore.installedItemList;
    const uniqueInstalledSet: CardFace[] = [];
    installedItemList.forEach((installedItem) => {
        const { appId, version } = installedItem;
        if (uniqueInstalledSet.some((item) => item.appId == appId)) {
            const item = uniqueInstalledSet.find((item) => item.appId == appId);
            if (item && hasUpdateVersion(item.version,version)) {
                const index = uniqueInstalledSet.findIndex((item) => item.appId == appId);
                uniqueInstalledSet.splice(index,1);
                uniqueInstalledSet.push(installedItem);
            }
        } else {
            uniqueInstalledSet.push(installedItem);
        }
    })
    uniqueInstalledSet.forEach((item) => {
        const { appId, version } = item;
        ipcRenderer.send("command", { command: `ll-cli query ${appId}`, appId: appId, version: version });
    })
    ipcRenderer.on('command-result', commandResult);
});
onBeforeUnmount(() => {
    ipcRenderer.removeListener('command-result', commandResult);
})
</script>
<style scoped>
.container {
    height: 100%;
    overflow-y: auto;
}

.card_container {
    display: grid;
    grid-gap: 10px;
    margin-right: 12px;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
}

.card_items {
    padding: 10px;
    flex: 1;
    min-width: 180px;
    border: 1px solid #ccc;
    border-radius: 5px;
    box-sizing: border-box;
    background-color: #999999;
}
</style>