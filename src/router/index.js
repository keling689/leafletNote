import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

// 获取原型对象上的push函数
const originalPush = VueRouter.prototype.push
// 修改原型对象中的push方法

VueRouter.prototype.push = function push (location) {
  return originalPush.call(this, location).catch(err => err)
}

const routes = [
  // 首页
  {
    path: '/',
    name: 'home',
    // component: () => import('@/views/editDatasSubmit'),
    component: () => import('@/views/home'),
    meta: {
      keepAlive: true
    }
  }
]

const router = new VueRouter({
  routes
})

export default router
