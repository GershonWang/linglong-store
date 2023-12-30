<template>
    <el-card class="container">
        <img class="image" src="@/assets/logo.png" alt="Image" />
        <span class="name">{{ name }}</span>
        <span class="version">{{ version }}</span>
        <div class="btm">
            <p class="desc">{{ description }}</p>
            <p class="os">{{ arch }}</p>
            <el-button class="uninstallBtn" v-if="isInstalled" @click="uninstallServ(appId,version)">卸载</el-button>
            <el-button class="installBtn" v-else @click="">安装</el-button>
        </div>
    </el-card>
</template>

<script setup lang="ts">
import { ipcRenderer } from "electron";
interface Props {
    iconUrl?: string,
    name?: string,
    version?: string,
    description?: string,
    arch?: string,
    isInstalled?: boolean,
    appId?: string
}
withDefaults(
    defineProps<Props>(),
    {
        iconUrl: "",
        name: "程序名称",
        version: "0.0.1",
        description: "描述说明",
        arch: "X86_64",
        isInstalled: true,
        appId: ""
    }
)

// 卸载程序
const uninstallServ = (appId: string,verion: string) => {
    ipcRenderer.send('uninstall-command', 'll-cli uninstall ' + appId + '/' + verion);
}
</script>

<style scoped>
.container {
    height: 280px;
    width: 200px;
    position: relative;
    /* background-color: #999; */
}
.image {
    width: 150px;
    margin: 0 auto;
    display: block;
}
.name {
    display: flex;
    justify-content: center;
    color: #36D;
    font-weight: bold;
    white-space: nowrap;
    /* overflow: hidden; */
    /* text-overflow: ellipsis; */
    /* max-width: 150px; */
}
.version {
    background-color: #999;
    display: flex;
    justify-content: center;
}
.btm {
    margin-top: 10px;
    line-height: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.desc {
    font-size: 12px;
    color: #999;
    /* 限制显示两行文本 */
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: normal;
    /* 可根据需要设置为nowrap来禁用折行 */
    max-width: 50%;
    /* 可根据需要设置最大宽度 */
}
.os {
    font-size: 12px;
    color: #999;
}
.installBtn {
    background-color: blue;
    color: white;
    padding: 5px;
    min-height: auto;
}
.uninstallBtn {
    background-color: red;
    color: white;
    padding: 5px;
    min-height: auto;
}</style>