<template>
    <div class="common-layout">
        <el-container>
            <el-aside width="200px">
                <el-menu default-active="2" class="el-menu-vertical-demo">
                    <el-menu-item index="1">
                        <el-icon><icon-menu /></el-icon>
                        <span><router-link to="/all_serv_menu">全部程序</router-link></span>
                    </el-menu-item>
                    <el-menu-item index="2" >
                        <el-icon><document /></el-icon>
                        <router-link to="/installed_menu">已安装程序</router-link>
                    </el-menu-item>
                    <el-menu-item index="3" disabled>
                        <el-icon><setting /></el-icon>
                        <span>基础设置</span>
                    </el-menu-item>
                </el-menu>
                <!-- 更多菜单项 -->
            </el-aside>
            <el-main>
                <!-- 这里将动态显示不同的功能页面 -->
                <router-view></router-view>
            </el-main>
        </el-container>
    </div>
</template>
<script setup lang="ts">

</script>
<style>
.el-container {
    background-color: burlywood;
}

.el-aside {
    background-color: rosybrown;
    height: 100%;
}

.el-main {
    background-color: aquamarine;
}
</style>