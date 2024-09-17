// 解析玲珑唯一标识
// ref唯一标识的组成结构 ${repo}/${channel}:${id}/${version}/${arch}
// deepin/main:org.deepin.calculator/1.2.2/x86_64
// 默认 repo 为 deepin
// 默认 channel 为 main
// main:org.dde.calendar/5.13.1.1/x86_64
// linglong:org.mamedev.mamedev
interface IRefParam {
    repo: string,
    channel: string,
    appId: string,
    version: string,
    arch: string
}

export function parseRef(ref: string) {
    let repo = '',channel = '',appId = '',version = '',arch = '';
    if (!ref) {
        return { repo, channel, appId, version, arch } as IRefParam;
    }
    if (ref.includes(':')) {
        const parts = ref.split(':');
        // ${repo}/${channel}
        const part1 = parts[0];
        const part1s = part1.split('/');
        if (part1s.length > 1) {
            repo = part1s[0];
            channel = part1s[1];
        } else {
            channel = part1s[0];
        }
        // ${id}/${version}/${arch}
        const part2 = parts[1];
        const part2s = part2.split('/');
        if (part2s.length > 2) {
            appId = part2s[0];
            version = part2s[1];
            arch = part2s[2];
        } else if (part2s.length > 1 && part2s.length <= 2) {
            appId = part2s[0];
            version = part2s[1];
        } else if (part2s.length > 0 && part2s.length <= 1) {
            appId = part2s[0];
        }
        return { repo, channel, appId, version, arch } as IRefParam;
    } else if (!ref.includes(':') && ref.includes('/')){
        const parts = ref.split('/');
        appId = parts[0];
        version = parts[1];
        if (parts.length > 2) {
            arch = parts[2];
        }
        return { repo, channel, appId, version, arch } as IRefParam;
    } else {
        appId = ref;
        return { repo, channel, appId, version, arch } as IRefParam;
    }
}