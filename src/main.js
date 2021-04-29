import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import '@geoman-io/leaflet-geoman-free'
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css'
import './mapExtent/marginfyingGlass'
import './mapExtent/marginfyingGlass.css'
import WKT from 'terraformer-wkt-parser'
import './mapExtent/feature-select'
import './mapExtent/feature-select.css'
import * as turf from '@turf/turf'

Vue.prototype.$L = L
Vue.prototype.$WKT = WKT
Vue.prototype.$turf = turf

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
