// 检测版本高于当前版本，返回true
const hasUpdateVersion = (thisVersion: string, checkVersion: string) => {
    const thisArray: string[] = thisVersion.split('.');
    const checkArray: string[] = checkVersion.split('.');
    let len = thisArray.length;
    if(thisArray.length > checkArray.length) {
        len = checkArray.length;
    }
    for(let i = 0; i < len; i++) {
        if (parseInt(thisArray[i]) < parseInt(checkArray[i])) {
            return true;
        } else if (parseInt(thisArray[i]) > parseInt(checkArray[i])) {
            return false;
        }
    }
    // 版本号相同
    return false;
}

export default hasUpdateVersion;