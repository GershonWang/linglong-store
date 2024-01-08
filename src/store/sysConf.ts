import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSysConfStore = defineStore('sysConf', () => {

    // 系统架构
    const arch = ref('x86_64');
    // 玲珑源地址
    const sourceUrl = ref('https://mirror-repo-linglong.deepin.com');
    // 是否过滤非当前架构程序
    const filterFlag = ref(true);

    // 修改系统架构信息
    const setArch = (inArch: string) => {
        arch.value = inArch;
    }
    // 设置成系统架构信息的默认值
    const setDefaultArch = () => {
        arch.value = "x86_64";
    }
    // 修改玲珑源地址
    const setSourceUrl = (inSourceUrl: string) => {
        sourceUrl.value = inSourceUrl;
    }
    // 设置成玲珑源地址的默认值
    const setDefaultSourceUrl = () => {
        sourceUrl.value = "https://mirror-repo-linglong.deepin.com";
    }
    // 修改过滤非当前架构程序
    const setFilterFlag = (inFilterFlag: boolean) => {
        filterFlag.value = inFilterFlag;
    }
    // 设置成过滤非当前架构程序的默认值
    const setDefaultFilterFlag = () => {
        filterFlag.value = true;
    }

    return {
        arch,
        sourceUrl,
        filterFlag,
        setArch,
        setDefaultArch,
        setSourceUrl,
        setDefaultSourceUrl,
        setFilterFlag,
        setDefaultFilterFlag
    }

}, {
	persist: {
		storage: localStorage,
		paths: ['info']
	}
})