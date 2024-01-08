import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { createPinia } from "pinia";
import persistedstate from "pinia-plugin-persistedstate"
import './style.css'
import App from './App.vue'
import router from './router'

const app = createApp(App);
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}
// elementplus
app.use(ElementPlus);
// 注册挂载pinia
const pinia = createPinia();
pinia.use(persistedstate);
app.use(pinia);
// 注册挂载路由
app.use(router);

app.mount('#app')
    .$nextTick(() => postMessage({ payload: 'removeLoading' }, '*'))
