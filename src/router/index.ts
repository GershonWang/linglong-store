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
                    name: 'Detail',
                    component: () => import("../components/details.vue")
                },
            ],
        },
    ], // `routes: routes` 的缩写
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) { // 如果有保存的滚动位置，则使用保存的位置
            return savedPosition;
        } else if (from.name === 'Detail') { // 如果是从明细页面返回，滚动到明细页面的位置
            console.log('router-to',to);
            console.log('router-from',from);
            console.log('router-savedPosition',savedPosition);
            return new Promise((resolve) => {
                resolve({ left: 0, top: Number(from.meta.savedPosition) || 0 });
            });
        } else { // 默认滚动到页面顶部
            return new Promise((resolve) => {
                resolve({ left: 0, top: 0 });
            });
        }
    },
})

export default router