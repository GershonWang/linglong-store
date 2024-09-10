const { app, Tray, Menu } = require('electron');
import { BrowserWindow } from "electron";
import { join } from "node:path";

const TrayMenu = (mainWindow: BrowserWindow) => {
    const iconPath = join(process.env.PUBLIC, "logo.png");
    const tray = new Tray(iconPath);
 
    // 为托盘图标创建上下文菜单
    const contextMenu = Menu.buildFromTemplate([
        { 
            label: '显示商店',
            click: () => {
                if (mainWindow.isMinimized()) {
                    mainWindow.restore();
                }
                mainWindow.show();
            } 
        },
        { 
            label: '基础设置', 
            type: 'radio' 
        },
        { 
            label: '退出', 
            click: () => app.quit() 
        }
    ]);
    
    tray.setToolTip('玲珑应用商店')
    // tray.setTitle('This is my title')

    // 为托盘图标设置上下文菜单
    tray.setContextMenu(contextMenu);
    
    // 单击托盘图标时的行为（通常是显示上下文菜单）
    tray.on('click', () => {
        // 如果菜单已经显示，则隐藏，否则显示
        if (contextMenu.items[0].checked) {
            contextMenu.items[0].checked = false;
            contextMenu.items[1].checked = true;
        } else {
            contextMenu.items[0].checked = true;
            contextMenu.items[1].checked = false;
        }
    });
}

export default TrayMenu;