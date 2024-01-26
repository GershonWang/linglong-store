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
                    component: () => import("../pages/mainView/1_AllServMenu/index.vue")
                },
                {
                    path: '/installed_menu',
                    component: () => import("../pages/mainView/2_InstalledMenu/index.vue")
                },
                {
                    path: '/update_menu',
                    component: () => import("../pages/mainView/3_UpdateMenu/index.vue")
                },
                {
                    path: '/runtime_menu',
                    component: () => import("../pages/mainView/4_RuntimeMenu/index.vue")
                },
                {
                    path: '/config_menu',
                    component: () => import("../pages/mainView/98_ConfigMenu/index.vue")
                },
                {
                    path: '/about_menu',
                    component: () => import("../pages/mainView/99_AboutMenu/index.vue")
                },
                {
                    path: '/details',
                    component: () => import("../components/details.vue")
                },
            ],
        },
    ], // `routes: routes` 的缩写
})

export default router