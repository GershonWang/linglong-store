import { defineStore } from 'pinia'

export const useStore = defineStore('store', {
    state: () => ({
        name: 'Vue',
        age: 18,
    }),
    getters: {
        doubleAge: (state) => state.age * 2,
        getPerson: (state) => {
            return `${state.name}今年${state.age}岁了`
        },
    },
    actions: {
        changeName(name: string) {
            const that = this;
            setTimeout(() => {
                that.name = name;
            }, 1000)
        },
    },
})