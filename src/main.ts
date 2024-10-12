import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate"
import VueLazyload from 'vue-lazyload'
import loadimage from '@/assets/logo.svg'
import errorimage from '@/assets/logo.svg'
import './style.css'
import App from './App.vue'
import router from './router'

import './node-api'

const app = createApp(App);
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}
// elementplus
app.use(ElementPlus,{
  locale: zhCn,
});
// 注册挂载pinia
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);
app.use(pinia);
// 配置项
app.use(VueLazyload, {
  preLoad: 1.3, //预加载的宽高比
  loading: loadimage, //图片加载状态下显示的图片
  error: errorimage, //图片加载失败时显示的图片
  attempt: 1, // 加载错误后最大尝试次数
})
// 注册挂载路由
app.use(router);

app.mount('#app')
    .$nextTick(() => postMessage({ payload: 'removeLoading' }, '*'))
