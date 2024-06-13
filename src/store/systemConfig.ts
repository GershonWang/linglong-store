import { defineStore } from 'pinia'
import { ref } from 'vue'
// 自动检测更新
const checkUpdate = import.meta.env.VITE_CONFIG_CHECKUPDATE as boolean;
/**
 * 系统基本参数配置
 */
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
        autoCheckUpdate: ref(checkUpdate),
        // 网络运行状态
        networkRunStatus: ref(true),
        // 当前收录玲珑程序数量
        linglongCount: ref(0),
        // linglong-bin的包版本号
        linglongBinVersion: ref(''),
        // 默认仓库名称
        defaultRepoName: ref(''),
        // 指纹码
        visitorId: ref(''),
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
            + ',linglongCount:' + state.linglongCount
            + ',linglongBinVersion:' + state.linglongBinVersion
            + ',defaultRepoName:' + state.defaultRepoName
            + ',visitorId:' + state.visitorId
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
        changeIsShowDisArch(isShowDisArch: boolean){
            const that = this;
            that.isShowDisArch = isShowDisArch;
        },
        // 修改是否显示无图标玲珑程序
        changeIsShowNoIcon(isShowNoIcon: boolean){
            const that = this;
            that.isShowNoIcon = isShowNoIcon;
        },
        // 修改是否显示基础运行服务
        changeIsShowBaseService(isShowBaseService: boolean){
            const that = this;
            that.isShowBaseService = isShowBaseService;
        },
        // 修改是否自动检测更新
        changeAutoCheckUpdate(autoCheckUpdate: boolean){
            const that = this;
            that.autoCheckUpdate = autoCheckUpdate;
        },
        // 修改网络运行状态
        changeNetworkRunStatus(networkRunStatus: boolean){
            const that = this;
            that.networkRunStatus = networkRunStatus;
        },
        // 修改网络运行状态
        changeLinglongCount(linglongCount: number){
            const that = this;
            that.linglongCount = linglongCount;
        },
        // 修改linglong-bin的包版本号
        changeLinglongBinVersion(linglongBinVersion: string){
            const that = this;
            that.linglongBinVersion = linglongBinVersion;
        },
        // 修改默认仓库名称
        changeDefaultRepoName(defaultRepoName: string){
            const that = this;
            that.defaultRepoName = defaultRepoName;
        },
        // 修改指纹码
        changeVisitorId(visitorId: string){
            const that = this;
            that.visitorId = visitorId;
        }
    },
    persist: true
})