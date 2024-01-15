import { app } from "electron";
import log from "electron-log";
import { join } from "node:path";
import fs from "fs-extra";

let logDir = app.getPath('logs');
const updatePendingPath = join(logDir, 'print-updater')
log.warn('updatePendingPath:' + updatePendingPath)
fs.emptyDir(updatePendingPath)
log.transports.file.fileName = join('print-updater','main.log');
log.transports.file.level = 'info';
// 达到最大上限后，备份文件并重命名为：main.old.log，有且仅有一个备份文件
log.transports.file.maxSize = 1048576;
log.transports.console.level = 'silly';
 
export default log