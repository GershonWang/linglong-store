// Card.ts
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
    loading?: boolean
}
// 运行中对象
export interface RunTime {
    App: string,
    ContainerID: string,
    Pid: string,
    Path: string
}

export interface CommandData {
    command: string,
}
