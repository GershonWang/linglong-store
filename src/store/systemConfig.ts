import { defineStore } from 'pinia'
import { ref } from 'vue'
/**
 * 系统基本参数配置
 */
export const useSystemConfigStore = defineStore('systemConfig', {
    state: () => ({
        // 客户端版本号
        appVersion: ref(''),
        // 系统架构
        arch: ref('x86_64'),
        // 玲珑版本
        llVersion: ref('1.3.8'),
        // 默认仓库名称
        defaultRepoName: ref(''),
        // 玲珑源地址 'https://mirror-repo-linglong.deepin.com'
        sourceUrl: ref<Record<string, any>[]>(),
        // 当前收录玲珑程序数量
        linglongCount: ref(0),
        // linglong-bin的包版本号
        llBinVersion: ref(''),
        // 指纹码
        visitorId: ref(''),
        // 玲珑基本信息
        detailMsg: ref(''),
        // 系统版本
        osVersion: ref(''),
        // 客户端ip地址
        clientIp: ref(''),
        // 启动应用更新提醒
        isShowUpdateTip: ref(true),
        // 是否显示基础运行服务
        isShowBaseService: ref(false),
        // 自动检测更新
        autoCheckUpdate: ref(true),
        // 是否记住关闭窗口
        rememberCloseDialog: ref(false),
        // 关闭窗口记住上次操作
        rememberLastAction: ref("minimize"),
    }),
    getters: {
        getSystemConfigInfo: (state) => {
            return 'appVersion:' + state.appVersion
            + ',arch:' + state.arch 
            + ',llVersion:' + state.llVersion 
            + ',sourceUrl:' + JSON.stringify(state.sourceUrl) 
            + ',linglongCount:' + state.linglongCount
            + ',llBinVersion:' + state.llBinVersion
            + ',defaultRepoName:' + state.defaultRepoName
            + ',visitorId:' + state.visitorId
            + ',detailMsg:' + state.detailMsg
            + ',osVersion:' + state.osVersion
            + ',clientIp:' + state.clientIp
            + ',isShowUpdateTip:' + state.isShowUpdateTip
            + ',isShowBaseService:' + state.isShowBaseService 
            + ',autoCheckUpdate:' + state.autoCheckUpdate
            + ',rememberCloseDialog:' + state.rememberCloseDialog
            + ',rememberLastAction:' + state.rememberLastAction
        },
        // 获取客户端ip地址
        getClientIp: (state) => {
            return state.clientIp;
        },
    },
    actions: {
        // 修改客户端版本号
        changeAppVersion(appVersion: string){
            const that = this;
            that.appVersion = appVersion;
        },
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
        // 修改默认仓库名称
        changeDefaultRepoName(defaultRepoName: string){
            const that = this;
            that.defaultRepoName = defaultRepoName;
        },
        // 修改玲珑源地址
        changeSourceUrl(inSourceUrl: Record<string, any>[]){
            const that = this;
            that.sourceUrl = inSourceUrl;
        },
        // 修改当前收录玲珑程序数量
        changeLinglongCount(linglongCount: number){
            const that = this;
            that.linglongCount = linglongCount;
        },
        // 修改linglong-bin的包版本号
        changeLlBinVersion(llBinVersion: string){
            const that = this;
            that.llBinVersion = llBinVersion;
        },
        // 修改指纹码
        changeVisitorId(visitorId: string){
            const that = this;
            that.visitorId = visitorId;
        },
        // 修改组件基础信息
        changeDetailMsg(detailMsg: string){
            const that = this;
            that.detailMsg = detailMsg;
        },
        // 修改系统版本信息
        changeOsVersion(osVersion: string){
            const that = this;
            that.osVersion = osVersion;
        },
        // 修改客户端ip
        changeClientIp(clientIp: string){
            const that = this;
            that.clientIp = clientIp;
        },
        // 修改启动应用更新提醒
        changeIsShowUpdateTip(isShowUpdateTip: boolean){
            const that = this;
            that.isShowUpdateTip = isShowUpdateTip;
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
        // 修改是否记住关闭窗口
        changeRememberCloseDialog(rememberCloseDialog: boolean){
            const that = this;
            that.rememberCloseDialog = rememberCloseDialog;
        },
        // 修改关闭窗口记住上次操作
        changeRememberLastAction(rememberLastAction: string){
            const that = this;
            that.rememberLastAction = rememberLastAction;
        },
    },
    persist: true
})