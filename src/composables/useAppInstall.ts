/**
 * 应用安装 Composables
 * 封装应用安装相关逻辑
 */

import { ref } from 'vue';
import { ipcRenderer } from 'electron';
import { useInstallingItemsStore } from '@/store/installingItems';
import { useUpdateStatusStore } from '@/store/updateStatus';
import { deepClone } from '@/util/clone';
import { InstalledEntity } from '@/interface';

export function useAppInstall() {
    const installingItemsStore = useInstallingItemsStore();
    const updateStatusStore = useUpdateStatusStore();
    const installing = ref(false);

    /**
     * 安装应用
     * @param item 要安装的应用
     * @param password 可选密码
     */
    const installApp = (item: InstalledEntity, password?: string | null) => {
        if (installing.value || updateStatusStore.downloadQueueStatus) {
            return;
        }
        
        installing.value = true;
        installingItemsStore.addItem(item);
        
        const pwd = password || localStorage.getItem('linyaps-password');
        ipcRenderer.send('linyaps-install', deepClone({ password: pwd, ...item }));
    };

    /**
     * 重置安装状态
     */
    const resetInstalling = () => {
        installing.value = false;
    };

    return { 
        installApp, 
        installing,
        resetInstalling,
    };
}

