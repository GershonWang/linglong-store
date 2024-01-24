const hasUpdateVersion = (thisVersion: string, checkVersion: string) => {
    const thisArray: string[] = thisVersion.split('.');
    const checkArray: string[] = checkVersion.split('.');
    if(thisArray.length > checkArray.length) {
        return false;
    } else if (thisArray.length < checkArray.length) {
        return true;
    } else {
        for(let i = 0; i < thisArray.length; i++) {
            if(parseInt(thisArray[i]) < parseInt(checkArray[i])) {
                return true;
            } else if(parseInt(thisArray[i]) > parseInt(checkArray[i])) {
                return false;
            } else {
                continue;
            }
        }
        // 版本号相同
        return false;
    }
}

export default hasUpdateVersion;