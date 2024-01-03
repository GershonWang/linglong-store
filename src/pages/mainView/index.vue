<template>
    <div class="common-layout">
        <el-container>
            <el-aside>
                <el-menu default-active="1">
                    <el-menu-item index="1" @click="toPage('/all_serv_page')">
                        <el-icon color="#D3D3D3"><HomeFilled /></el-icon>
                        <span>全部程序</span>
                    </el-menu-item>
                    <el-menu-item index="2" @click="toPage('/installed_page')">
                        <el-icon><GobletSquareFull /></el-icon>
                        <span>已安装程序</span>
                    </el-menu-item>
                    <el-menu-item index="3" @click="toPage('/config_menu')">
                        <el-icon><setting /></el-icon>
                        <span>基础设置</span>
                    </el-menu-item>
                    <el-menu-item index="4" @click="toPage('/about_menu')">
                        <el-icon><InfoFilled /></el-icon>
                        <span>关于程序</span>
                    </el-menu-item>
                    <hr>
                    <el-menu-item index="5" @click="toPage('/card_comp')" style="display: none;">
                        <el-icon><GobletSquareFull /></el-icon>
                        <span>卡片组件</span>
                    </el-menu-item>
                    <el-menu-item index="999" @click="toPage('/')">
                        <el-icon><Loading /></el-icon>
                        <span>返回首页</span>
                    </el-menu-item>
                </el-menu>
                <!-- 更多菜单项 -->
            </el-aside>
            <el-main class="views">
                <!-- 这里将动态显示不同的功能页面 -->
                <router-view></router-view>
            </el-main>
        </el-container>
    </div>
</template>
<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();
function toPage(url:string) {
    router.push(url);
}
</script>
<style>
.common-layout {
    height: 100%;
    width: 100%;
}
.el-container {
    height: 100%;
}
.el-aside {
    width: 200px;
    margin: 12px 0 12px 12px;
    border-radius: 15px;
}
.el-menu {
    height: 100%;
    background-color: #2D2F2F;
    border-right-style: none;
    overflow-y: hidden;
}
.el-menu-item {
    color: white;
    font-weight: bold;
    border-radius: 15px;
    background-color: #6E6E6E;
    text-align: center;
    margin: 5px;
}
a {
  font-weight: bold;
  color: #D3D3D3;
  text-decoration: inherit;
}
a:hover {
  color: #2D2F2F;
}
.views {
    background-color: #2D2F2F;
    overflow: hidden;
    border-radius: 15px;
    margin: 12px;
    padding: 12px;
    position: relative;
}
</style>