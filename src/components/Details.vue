<template>
    <div class="baseContainer">
        <div class="title">参数信息</div>
        <div class="baseMessage">
            <div class="imageDiv">
                <img class="image" :src="query.icon as string || defaultImage"
                    @error="(e: any) => e.target.src = defaultImage" alt="Image" />
            </div>
            <div class="same">
                <div class="soft">
                    <div>
                        <a class="softTitle">应用程序名称：</a>{{ query.name }}
                    </div>
                    <div>
                        <a class="softTitle">AppID：</a>{{ query.appId }}
                    </div>
                    <div>
                        <a class="softTitle">应用架构：</a>{{ query.arch }}
                    </div>
                </div>
                <div>
                    <a class="softTitle">应用简述：</a>{{ query.description }}
                </div>
            </div>
        </div>
    </div>
    <div class="chooseVerson">
        <div class="title">版本选择</div>
        <el-table :data="tableData" style="width: 100%;height: 95%;border-radius: 5px">
            <el-table-column prop="name" label="名称" width="180" />
            <el-table-column prop="version" label="版本号" width="180"/>
            <el-table-column prop="description" label="描述" />
            <el-table-column fixed="right" label="操作" width="120">
            <template #default>
                <el-button link type="primary" size="small" @click="handleClick">
                    安装
                </el-button>
                <el-button link type="primary" size="small">
                    卸载
                </el-button>
            </template>
            </el-table-column>
        </el-table>
        <!-- <div>{{ query.version }}</div> -->
    </div>
</template>
<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();
const query = router.currentRoute.value.query;
import defaultImage from '@/assets/logo.svg'
import { onBeforeUnmount, onMounted, reactive } from 'vue';
import { ipcRenderer } from 'electron';
import { CardFace } from './CardFace';

const tableData = reactive<CardFace[]>([]);

const handleClick = () => {
  console.log('click')
}

const commandResult = (_event: any, res: any) => {
    const command: string = res.param.command;
    if (command.startsWith('ll-cli query') && 'stdout' == res.code) {
        const apps: string[] = res.result.split("\n");
        if (apps.length > 1) {
            const header = apps[0].split("[1m[38;5;214m")[1];
            const descriptionNum = header.indexOf("description");
            // 第0条是分类项不是应用，需要剔除，最后一行空，也需要剔除
            for (let index = 1; index < apps.length - 1; index++) {
                const element: string = apps[index];
                const items: RegExpMatchArray | null = element.match(/'[^']+'|\S+/g);
                if (!items || items[0] == "org.deepin.Runtime" || items[5] == 'devel') { // 去除空行和运行时服务
                    continue;
                }
                tableData.push({
                    appId: items[0],
                    name: items[1] ? items[1] : "-",
                    version: items[2],
                    arch: items[3],
                    channel: items[4],
                    module: items[5],
                    description: element.substring(descriptionNum).trim(),
                })
            }
        }
    }
}
onMounted(() => {
    ipcRenderer.send("command", { name: "查询该程序所有版本列表", command: "ll-cli query " + query.appId });
    ipcRenderer.on('command-result', commandResult);
})
onBeforeUnmount(() => {
    ipcRenderer.removeListener('command-result', commandResult);
})
</script>
<style scoped>
.baseContainer {
    background-color: #999999;
    border-radius: 5px;
    margin-bottom: 3px;
    height: 30%;
}

.chooseVerson {
    background-color: #999999;
    border-radius: 5px;
    margin-bottom: 3px;
    height: 70%;
}

.title {
    background-color: cadetblue;
    border-radius: 5px;
    padding-left: 16px;
    padding-top: 3px;
    padding-bottom: 3px;
    margin-bottom: 1px;
    font-weight: bold;
}

.baseMessage {
    padding: 12px;
    display: flex;
}

.imageDiv {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    width: 20%;
    height: 150px;
}

.image {
    width: 120px;
    height: 120px;
}

.same {
    width: 80%;
}

.soft {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-right: 12px;
    margin-bottom: 16px;
}

.softTitle {
    font-size: 18px;
}</style>