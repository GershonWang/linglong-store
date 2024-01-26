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