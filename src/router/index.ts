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
            redirect: '/all_serv_page',
            component: () => import("../pages/mainView/index.vue"),
            children: [
                {
                    path: '/all_serv_page',
                    component: () => import("../pages/mainView/1_AllServMenu/index.vue")
                },
                {
                    path: '/installed_page',
                    component: () => import("../pages/mainView/2_InstalledMenu/index.vue")
                },
                {
                    path: '/config_menu',
                    component: () => import("../pages/mainView/3_ConfigMenu/index.vue")
                },
                {
                    path: '/about_menu',
                    component: () => import("../pages/mainView/4_AboutMenu/index.vue")
                },
                {
                    path: '/card_comp',
                    component: () => import("../components/Card.vue")
                },
                {
                    path: '/update_menu',
                    component: () => import("../pages/mainView/5_UpdateMenu/index.vue")
                },
            ],
        },
    ], // `routes: routes` 的缩写
})

export default router