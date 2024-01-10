const log = require('electron-log')
log.transports.file.fileName = 'main.log';
log.transports.file.level = 'false';
// 达到最大上限后，备份文件并重命名为：main.old.log，有且仅有一个备份文件
log.transports.file.maxSize = 1048576;
log.transports.console.level = 'silly';
 
export default log