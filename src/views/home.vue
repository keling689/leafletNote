<template>
    <!-- <div>
        主页
    </div> -->
    <div id="map"></div>
</template>
<script>
import { drawMarker } from '@/utils'
export default {
  name: 'mapView',
  data () {
    return {
      mapView: null
    }
  },
  created () {

  },
  mounted () {
    this.initMap()
    this.addLayers()
  },
  methods: {
    initMap () {
      this.mapView = this.$L.map('map', {
        zoom: 12,
        minZoom: 1,
        maxZoom: 25,
        center: [39.550339, 116.114129],
        zoomControl: false, // 左上角的加减缩小放大图标是否隐藏
        attributionControl: false, // 下方跳转链接是否展示
        crs: this.$L.CRS.EPSG3857,
        layers: this.$L.tileLayer('http://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
          attribution: '&copy; 高德地图',
          maxZoom: 25,
          minZoom: 1,
          subdomains: '1234'
        })
      })
      console.log('创建leaflet')
    },
    addLayers () {
      const point = [39.550339, 116.114129]
      drawMarker(this.$L, this.mapView, point)
      this.$L.marker(point).addTo(this.mapView)
      // this.$L.
    }
  }
}
</script>

<style lang="scss">
    #map {
        height:100%;
        width:100%;
        background: #ccc;
    }
</style>
