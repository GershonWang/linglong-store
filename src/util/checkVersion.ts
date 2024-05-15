/**
 * 当比较的两个版本相同时返回值为 0<br>
 * 当检测版本低于基数版本时返回值为 -1<br>
 * 当检测版本高于基数版本时返回值为 1
 * @param thisVersion 作为比较的基数版本
 * @param checkVersion 要比较检测的版本
 * @returns 
 */
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

// version1(1.0.1-beta)和version2(1.0.1)比较版本大小
export const compareVersions = (version1: string, version2: string) => {
    const mainAndSuffix1 = version1.split('-');
    const mainAndSuffix2 = version2.split('-');
    // 先比较中横线前半部分版本号大小
    const levels1 = mainAndSuffix1[0].split('.');
    const levels2 = mainAndSuffix2[0].split('.');

    for (let i = 0; i < Math.max(levels1.length, levels2.length); i++) {
        const num1: number = parseInt(levels1[i] || '0', 10);
        const num2: number = parseInt(levels2[i] || '0', 10);
        if (num1 > num2) {
            return 1;
        } else if (num1 < num2) {
            return -1;
        }
    }
    // 如果前半部分版本号相等，则比较中横线后的版本号
    if (!mainAndSuffix1[1] && !mainAndSuffix2[1]) {
        return 0;
    } else if (!mainAndSuffix1[1] && mainAndSuffix2[1]) {
        return 1;
    } else if (mainAndSuffix1[1] && !mainAndSuffix2[1]) {
        return -1;
    } else {
        const suffix1 = mainAndSuffix1[1].split('.');
        const suffix2 = mainAndSuffix2[1].split('.');
        for (let i = 0; i < Math.max(suffix1.length, suffix2.length); i++) {
            const num1: number = parseInt(suffix1[i] || '0', 10);
            const num2: number = parseInt(suffix2[i] || '0', 10);
            if (num1 > num2) {
                return 1;
            } else if (num1 < num2) {
                return -1;
            }
        }
        return 0;
    }
}

export default hasUpdateVersion;