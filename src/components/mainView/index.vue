<template>
    <div class="common-layout">
        <el-container>
            <el-aside>
                <el-menu default-active="1">
                    <el-menu-item index="1">
                        <el-icon color="#D3D3D3"><HomeFilled /></el-icon>
                        <span><router-link to="/all_serv_menu">全部程序</router-link></span>
                    </el-menu-item>
                    <el-menu-item index="2">
                        <el-icon><GobletSquareFull /></el-icon>
                        <span><router-link to="/installed_menu">已安装程序</router-link></span>
                    </el-menu-item>
                    <el-menu-item index="3">
                        <el-icon><setting /></el-icon>
                        <span><router-link to="/config_menu">基础设置</router-link></span>
                    </el-menu-item>
                    <el-menu-item index="4">
                        <el-icon><InfoFilled /></el-icon>
                        <span><router-link to="/about_menu">关于程序</router-link></span>
                    </el-menu-item>
                    <el-menu-item index="5">
                        <el-icon><Loading /></el-icon>
                        <span><router-link to="/">返回首页</router-link></span>
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
.el-main {
    background-color: #2D2F2F;
    overflow: hidden;
    border-radius: 15px;
    margin: 12px;
    padding: 12px;
}
</style>