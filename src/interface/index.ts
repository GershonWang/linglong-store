/**
 * 存放所有的接口对象参数
 */

/**
 * 安装对象
 */
export interface InstalledEntity {
    appId: string, // 1.4.x版本玲珑id
    appid?: string, // 1.5.0版本玲珑id
    id?: string, // 1.5.1版本玲珑id
    name: string, // 玲珑名称
    arch: string, // 架构
    base: string, // 基础依赖
    channel: string, // 玲珑渠道
    kind: string, // 玲珑类型
    module: string, // 玲珑模块
    runtime: string, // 运行依赖
    size: string, // 文件大小
    version: string, // 玲珑版本
    description: string, // 玲珑描述
    schema_version: string, // 玲珑schema版本
    /* ************ list ************ */
    command: string, // 命令行
    install_time: string, // 安装时间
    permissions: string, // 权限
    extensions: string, // 扩展
    /* ********** update ********* */
    oldVersion?: string, // 老版本
    newVersion?: string, // 最新版本
    /* ********** 后台接口 ********* */
    icon?: string, // 玲珑图标
    zhName?: string, // 玲珑名称
    categoryName?: string, // 分类名称
    createTime?: string, // 上架时间
    installCount?: number, // 安装次数
    uninstallCount?: number, // 卸载次数
    uabUrl?: string, // 玲珑地址
    user?: string, // 用户名
    devName?: string, // 维护者名称
    /* ********** 非命令传递字段 ********* */
    repoName: string, // 来源仓库
    isInstalled?: boolean, // 是否已安装
    loading?: boolean,  // 是否正在安装
    schedule?: string,  // 安装进度
}

/**
 * 玲珑更新对象
 */
export interface updateEntity {
    id: string, // 玲珑id
    old_version: string, // 旧版本号
    new_version: string, // 新版本号
}

/**
 * 响应体对象
 * @param code 状态码
 * @param message 提示信息
 * @param data 返回的数据
 */
export interface Result<T = any> {
    code: number;
    data: T;
    msg: string;
}

/**
 * 分页响应体对象
 */
export interface pageResult {
    current: number,
    size: number,
    total: number,
    records: any[]
    pages: number
}

/**
 * 分类对象
 */
export interface categoryItem {
    categoryId: string,
    categoryName: string,
}

/**
 * 执行命令返回对象
 * @param stdout 标准输出
 * @param stderr 错误输出
 * @param error 错误信息
 */
export interface execEntity {
    stdout: string,
    stderr: string,
    error: string,
}

/**
 * 评论对象
 */
export interface commentItem {
    id: string,
    appId: string,
    remark: string,
    version: string,
    cip: string,
    createTime: string,
}