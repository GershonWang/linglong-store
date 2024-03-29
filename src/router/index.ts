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
            redirect: '/welcome_menu',
            component: () => import("../pages/mainView/index.vue"),
            children: [
                {
                    path: '/all_serv_menu',
                    name: 'AllServMenu',
                    component: () => import("../pages/mainView/1_AllServMenu/index.vue"),
                    beforeEnter: (to, from, next) => {
                        // 在路由进入时执行的操作(非明细页面重置元数据)
                        if (from.name != 'Detail') {
                            to.meta.savedPosition = 0;
                            to.meta.savedPageNo = 0; // 将页码保存到路由元数据中
                            to.meta.savedPageSize = 0; // 将每页条数保存到路由元数据中
                            to.meta.savedSearchName = ''; // 将搜索内容保存到路由元数据中
                        }
                        // 如果需要继续导航，调用 next()
                        next();
                    },
                },
                {
                    path: '/installed_menu',
                    name: 'InstalledMenu',
                    component: () => import("../pages/mainView/2_InstalledMenu/index.vue"),
                    beforeEnter: (to, from, next) => {
                        // 在路由进入时执行的操作(非明细页面重置元数据)
                        if (from.name != 'Detail') {
                            to.meta.savedPosition = 0;
                            to.meta.savedPageNo = 0; // 将页码保存到路由元数据中
                            to.meta.savedPageSize = 0; // 将每页条数保存到路由元数据中
                        }
                        // 如果需要继续导航，调用 next()
                        next();
                    },
                },
                {
                    path: '/update_menu',
                    name: 'UpdateMenu',
                    component: () => import("../pages/mainView/3_UpdateMenu/index.vue")
                },
                {
                    path: '/runtime_menu',
                    name: 'RuntimeMenu',
                    component: () => import("../pages/mainView/4_RuntimeMenu/index.vue")
                },
                {
                    path: '/welcome_menu',
                    name: 'WelcomeMenu',
                    component: () => import("../pages/mainView/5_WelcomeMenu/index.vue")
                },
                {
                    path: '/ranking_menu',
                    name: 'RankingMenu',
                    component: () => import("../pages/mainView/6_RankingMenu/index.vue"),
                    children: [
                        {
                            path: '/new_ranking',
                            name: 'NewRanking',
                            component: () => import("../pages/mainView/6_RankingMenu/6.1_NewRanking/index.vue"),
                        },
                        {
                            path: '/down_ranking',
                            name: 'DownRanking',
                            component: () => import("../pages/mainView/6_RankingMenu/6.2_downRanking/index.vue")
                        }
                    ]
                },
                {
                    path: '/config_menu',
                    name: 'ConfigMenu',
                    component: () => import("../pages/mainView/98_ConfigMenu/index.vue")
                },
                {
                    path: '/about_menu',
                    name: 'AboutMenu',
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
})

export default router