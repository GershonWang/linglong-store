import { useSystemConfigStore } from "@/store/systemConfig";
const systemConfigStore = useSystemConfigStore();

const elertTip = () => {
    // console.log("进入网络状态提示...");
    if (!systemConfigStore.networkRunStatus) {
        ElNotification({
            title: '提示',
            message: "网络状态不可用！请检查网络后,再重启商店使用...",
            type: 'error',
            duration: 5000,
        });
        return;
    }
};

export default elertTip;