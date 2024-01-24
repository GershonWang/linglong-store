const string2card = (str: string) => {
    const element: string = str.trim();
    const item = {
        appId: "",name: "",version: "",arch: "",
        channel: "",module: "",description: "",
        icon: '',loading: false,
    }
    const items: RegExpMatchArray | null = element.match(/'[^']+'|\S+/g);
    if (items && items.some((value: string) => value === "linglong")) {
        const channelIndex = items.findIndex((value: string) => value === "linglong");
        let name = "";
        if (channelIndex > 4) {
            for (let index = 1; index < channelIndex - 2; index++) {
                name += items[index] + " ";
            }
        } else if (channelIndex < 4) {
            name = "-";
        } else {
            name = items[1];
        }
        item.appId = items[0];
        item.name = name.trim();
        item.version = items[channelIndex - 2];
        item.arch = items[channelIndex - 1];
        item.channel = items[channelIndex];
        item.module = items[channelIndex + 1];
        let description = "";
        if (items.length - channelIndex > 2) {
            for (let index = channelIndex + 2; index < items.length; index++) {
                description += items[index] + " ";
            }
        } else if (items.length - channelIndex < 2) {
            description = " ";
        } else {
            description = items[channelIndex + 2];
        }
        item.description = description.trim();
    }
    return item;
}

export default string2card;