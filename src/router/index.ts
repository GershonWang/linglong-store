import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
    // 4. 内部提供了 history 模式的实现。为了简单起见，我们在这里使用 hash 模式。
    history: createWebHashHistory(),
    routes: [
        {
            path: '/',
            component: () => import("../components/index.vue")
        },
        {
            path: '/main_view',
            redirect: '/all_serv_menu',
            component: () => import("../components/mainView/index.vue"),
            children: [
                {
                    path: '/all_serv_menu',
                    component: () => import("../pages/allServMenu/index.vue")
                },
                {
                    path: '/installed_menu',
                    component: () => import("../pages/installedMenu/index.vue")
                },
                {
                    path: '/config_menu',
                    component: () => import("../pages/configMenu/index.vue")
                },
                {
                    path: '/about_menu',
                    component: () => import("../pages/aboutMenu/index.vue")
                },
            ],
        },
    ], // `routes: routes` 的缩写
})

export default router