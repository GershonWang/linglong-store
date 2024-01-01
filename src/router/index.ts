import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
    // 4. 内部提供了 history 模式的实现。为了简单起见，我们在这里使用 hash 模式。
    history: createWebHashHistory(),
    routes: [
        {
            path: '/',
            component: () => import("../pages/index.vue")
        },
        {
            path: '/main_view',
            redirect: '/all_serv_menu',
            component: () => import("../pages/mainView/index.vue"),
            children: [
                {
                    path: '/all_serv_menu',
                    component: () => import("../pages/mainView/allServMenu/index.vue")
                },
                {
                    path: '/installed_menu',
                    component: () => import("../pages/mainView/installedMenu/index.vue")
                },
                {
                    path: '/config_menu',
                    component: () => import("../pages/mainView/configMenu/index.vue")
                },
                {
                    path: '/about_menu',
                    component: () => import("../pages/mainView/aboutMenu/index.vue")
                },
                {
                    path: '/card_comp',
                    component: () => import("../components/Card.vue")
                },
                {
                    path: '/installed_page',
                    component: () => import("../pages/mainView/InstalledPage/index.vue")
                },
                {
                    path: '/all_serv_page',
                    component: () => import("../pages/mainView/AllServPage/index.vue")
                }
            ],
        },
    ], // `routes: routes` 的缩写
})

export default router