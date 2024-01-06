import { defineStore } from "pinia"
import {computed, ref} from "vue";

export const useThemeStore = defineStore("theme", ()=>{
    const defaultSize = ref(16)

    const getBigSize = computed(() => {
        return  defaultSize.value + 10
    })

    const changeSize = (size: number) => {
        defaultSize.value = size
    }
    
    return {
        defaultSize,
        getBigSize,
        changeSize,
    }
})