// 检测版本高于当前版本
// 版本相同返回0
// 第一个参数大于第二个参数，返回-1
// 第一个参数小于第二个参数，返回1
const hasUpdateVersion = (thisVersion: string, checkVersion: string) => {
    const thisArray: string[] = thisVersion.split('.');
    const checkArray: string[] = checkVersion.split('.');
    for (var i = 0; i < Math.max(thisArray.length, checkArray.length); i++) {
        var num1 = parseInt(thisArray[i] || '0', 10); //转换为整数并处理空值情况
        var num2 = parseInt(checkArray[i] || '0', 10);
        if (num1 > num2) return -1; //如果第一个版本大于第二个版本则返回-1
        else if (num1 < num2) return 1; //如果第一个版本小于第二个版本则返回1
    }
    return 0; //两个版本相等时返回0
}

export default hasUpdateVersion;