import {createRouter,createWebHistory} from 'vue-router'

const router = createRouter({
    // 4. 内部提供了 history 模式的实现。为了简单起见，我们在这里使用 hash 模式。
    history: createWebHistory(),
    routes: [
        { 
            path: '/', 
            component: () => import("../components/MainPage.vue")
        },
        { 
            path: '/Index', 
            component: () => import("../components/Index.vue")
        },
    ], // `routes: routes` 的缩写
})

export default router