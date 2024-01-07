// Card.ts
export interface CardFace {
    index?: number,
    icon?: string,
    name?: string,
    version?: string,
    description?: string,
    arch?: string,
    isInstalled?: boolean,
    appId?: string,
    id?: string,
    channel?: string,
    module?: string,
    command?:string
}