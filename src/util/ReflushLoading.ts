import { useAllAppItemsStore } from "@/store/allAppItems";
import { useInstalledItemsStore } from "@/store/installedItems";
import { useDifVersionItemsStore } from "@/store/difVersionItems";
import { useUpdateItemsStore } from '@/store/updateItems';
import { logger } from '@/util/logger';


const allAppItemsStore = useAllAppItemsStore();
const installedItemsStore = useInstalledItemsStore();
const difVersionItemsStore = useDifVersionItemsStore();
const updateItemsStore = useUpdateItemsStore();

export const StartLoading = (data: any) => {
    if (Array.isArray(data)) { // ✅ data 是一个 JSON 数组集合
        data.forEach(item => {
            allAppItemsStore.updateItemLoadingStatus(item, true);
            installedItemsStore.updateItemLoadingStatus(item, true);
            difVersionItemsStore.updateItemLoadingStatus(item, true);
            updateItemsStore.updateItemLoadingStatus(item, true);
        });
    } else if (data !== null && typeof data === 'object') { // ✅ data 是一个 JSON 对象
        allAppItemsStore.updateItemLoadingStatus(data, true);
        installedItemsStore.updateItemLoadingStatus(data, true);
        difVersionItemsStore.updateItemLoadingStatus(data, true);
        updateItemsStore.updateItemLoadingStatus(data, true);
    } else {
        // ❌ 不是对象也不是数组
        logger.warn('data 不是有效的 JSON 对象或数组');
    }
}

export const StopLoading = (data: any) => {
    if (Array.isArray(data)) { // ✅ data 是一个 JSON 数组集合
        data.forEach(item => {
            allAppItemsStore.updateItemLoadingStatus(item, false);
            installedItemsStore.updateItemLoadingStatus(item, false);
            difVersionItemsStore.updateItemLoadingStatus(item, false);
            updateItemsStore.updateItemLoadingStatus(item, false);
        });
    } else if (data !== null && typeof data === 'object') { // ✅ data 是一个 JSON 对象
        allAppItemsStore.updateItemLoadingStatus(data, false);
        installedItemsStore.updateItemLoadingStatus(data, false);
        difVersionItemsStore.updateItemLoadingStatus(data, false);
        updateItemsStore.updateItemLoadingStatus(data, false);
    } else {
        // ❌ 不是对象也不是数组
        logger.warn('data 不是有效的 JSON 对象或数组');
    }
}