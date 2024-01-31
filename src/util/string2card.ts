import { CardFace } from "@/interface/CardFace";

const string2card = (str: string) => {
    const element: string = str.trim();
    const items: RegExpMatchArray | null = element.match(/'[^']+'|\S+/g);
    if (items && items.some((value: string) => value == "linglong")) {
        const item: CardFace = {
            appId: "",name: "",version: "",arch: "",channel: "",
            module: "",description: "",icon: '',loading: false,
        }
        // channel所在的索引id
        const channelIndex = items.findIndex((value: string) => value === "linglong");
        let name = ''; // 应用名称
        if (channelIndex > 4) {
            for (let index = 1; index < channelIndex - 2; index++) {
                name += items[index] + ' ';
            }
        } else if (channelIndex < 4) {
            name = "-";
        } else {
            name = items[1] ? items[1] : '-';
        }
        let description = ''; // 应用描述
        if (items.length > channelIndex + 2) {
            for (let index = channelIndex + 2; index < items.length; index++) {
                description += items[index] + ' ';
            }
        } else if (items.length = channelIndex + 2) {
            description = items[channelIndex + 2] ? items[channelIndex + 2] : '';
        }
        // 第一列appId,不可为空
        item.appId = items[0];
        // 第二列name,可为空
        item.name = name.trim();
        // 特事特办(没办法，硬拆)
        if (items[0] == 'github.cytle.wechat-web-devtoolswechat-devtools') {
            item.appId = 'github.cytle.wechat-web-devtools';
            item.name = 'wechat-devtools';
        }
        if (items[0] == 'io.github.LiamRiddell.NoteMasterNoteMaster') {
            item.appId = 'io.github.LiamRiddell.NoteMaster';
            item.name = 'NoteMaster';
        }
        // 第三列version,不为空
        item.version = items[channelIndex - 2];
        // 第四列arch,不为空
        item.arch = items[channelIndex - 1];
        // 第五列channel,不为空，默认linglong
        item.channel = items[channelIndex];
        // 第六列module,不为空，默认runtime
        item.module = items[channelIndex + 1];
        // 第七列description,可为空
        item.description = description.trim();
        return item;
    }
    return null;
}

export default string2card;