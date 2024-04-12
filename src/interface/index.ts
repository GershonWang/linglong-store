/**
 * 存放所有的接口对象参数
 */

/**
 * 卡片信息
 */
export interface CardFace {
    id?: string,
    appId: string,
    name: string,
    version: string,
    description?: string,
    arch: string,
    icon?: string,
    channel?: string,
    module?: string,
    command?:string,
    isInstalled?: boolean,
    loading?: boolean,
    createTime?: string,
    installCount?: number,
    zhName?: string,
    size?: string,
}

/**
 * 运行中对象
 */
export interface RunTime {
    App: string,
    ContainerID: string,
    Pid: string,
    Path: string
}

/**
 * 安装对象
 */
export interface InstalledEntity {
    appId: string,
    arch: string,
    channel: string,
    description: string,
    icon: string,
    kind: string,
    module: string,
    name: string,
    repoName: string,
    runtime: string,
    size: string,
    uabUrl: string,
    user: string,
    version: string,
    isInstalled: boolean,
    loading: boolean,
}

/**
 * 玲珑列表请求入参对象
 */
export interface AppListParams {
    appId?: string,
    name?: string,
    categoryId?: string,
    kind?: string,
    module?: string,
    pageNo: number,
    pageSize: number,
}

/**
 * 玲珑详细信息对象
 */
export interface AppMain {
    id: string,
    appId: string,
    icon: string,
    zhName: string,
    categoryId: string,
    name: string,
    channel: string,
    arch: string,
    description: string,
    kind: string,
    module: string,
    repoName: string,
    runtime: string,
    size: string,
    uabUrl: string,
    user: string,
    version: string,
    installCount: number,
    uninstallCount: number,
    flag: string,
    createTime: string,
    updateTime: string,
    isDelete: string
}

/**
 * 响应体对象
 * @param code 状态码
 * @param message 提示信息
 * @param data 返回的数据
 */
export interface Result {
    code: number,
    message: string,
    data: any
}

export interface pageResult {
    current: number,
    size: number,
    total: number,
    records: any[]
    pages: number
}

/**
 * 请求参数
 * @param page 页码
 * @param size 每页条数
 */
export interface Pagination {
    page: number;
    size: number;
}