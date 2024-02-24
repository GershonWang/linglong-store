import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSystemConfigStore = defineStore('systemConfig', {
    state: () => ({
        // 系统架构
        arch: ref('x86_64'),
        // 玲珑版本
        llVersion: ref('1.3.8'),
        // 玲珑源地址
        sourceUrl: ref('https://mirror-repo-linglong.deepin.com'),
        // 是否显示非当前架构程序
        isShowDisArch: ref(true),
        // 是否显示无图标玲珑程序
        isShowNoIcon: ref(false),
        // 是否显示基础运行服务
        isShowBaseService: ref(false),
        // 自动检测更新
        autoCheckUpdate: ref(true),
        // 网络状态
        networkRunStatus: ref(true),
    }),
    getters: {
        getSystemConfigInfo: (state) => {
            return 'arch:' + state.arch 
            + ',llVersion:' + state.llVersion 
            + ',sourceUrl:' + state.sourceUrl 
            + ',isShowDisArch:' + state.isShowDisArch 
            + ',isShowNoIcon:' + state.isShowNoIcon 
            + ',isShowBaseService:' + state.isShowBaseService 
            + ',autoCheckUpdate:' + state.autoCheckUpdate
            + ',networkRunStatus:' + state.networkRunStatus
        },
        getIsShowDisArch: (state) => state.isShowDisArch,
    },
    actions: {
        // 修改系统架构信息
        changeArch(inArch: string){
            const that = this;
            that.arch = inArch;
        },
        // 修改玲珑版本信息
        changeLlVersion(llVersion: string){
            const that = this;
            that.llVersion = llVersion;
        },
        // 修改玲珑源地址
        changeSourceUrl(inSourceUrl: string){
            const that = this;
            that.sourceUrl = inSourceUrl;
        },
        // 修改是否显示非当前架构程序
        changeIsShowDisArch(inShowDisArch: boolean){
            const that = this;
            that.isShowDisArch = inShowDisArch;
        },
        // 修改是否显示无图标玲珑程序
        changeIsShowNoIcon(inShowNoIcon: boolean){
            const that = this;
            that.isShowNoIcon = inShowNoIcon;
        },
        // 修改是否显示基础运行服务
        changeIsShowBaseService(inShowBaseService: boolean){
            const that = this;
            that.isShowBaseService = inShowBaseService;
        },
        // 自动检测更新
        changeAutoCheckUpdate(autoCheckUpdate: boolean){
            const that = this;
            that.autoCheckUpdate = autoCheckUpdate;
        },
        // 自动检测更新
        changeNetworkRunStatus(networkRunStatus: boolean){
            const that = this;
            that.networkRunStatus = networkRunStatus;
        },
    },
    persist: true
})