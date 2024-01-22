import { app } from "electron";
import log from "electron-log";
import { join } from "node:path";
import fs from "fs-extra";
// 在app缓存目录，创建目录
const updatePendingPath = join(app.getPath('logs'), 'print-updater');
// 检测更新日志目录是否存在
fs.pathExists(updatePendingPath, (exists) => {
    if (!exists) {
        fs.emptyDir(updatePendingPath);
    }
});
log.transports.file.format = '{h}:{i}:{s} {level} {text}';
log.transports.file.resolvePathFn = () => join(updatePendingPath,'main.log');
log.transports.file.level = 'info';
// 达到最大上限后，备份文件并重命名为：main.old.log，有且仅有一个备份文件
log.transports.file.maxSize = 1048576;
log.transports.console.level = 'silly';
// 打印日志
log.warn('升级日志文件缓存路径:' + updatePendingPath);
export default log