<template>
    <!-- <div>
        主页
    </div> -->
    <div id="map"></div>
</template>
<script>
// import { drawMarker } from '@/utils'
export default {
  name: 'mapView',
  props: {},
  data () {
    return {
      mapView: null,
      defaultPoint: [22.629519605146683, 114.05533790588379],
      defaultLine: [
        [
          22.6412242700425,
          114.05482292175293
        ],
        [
          22.63322321946228,
          114.0555953979492
        ],
        [
          22.63330244006855,
          114.05216217041016
        ],
        [
          22.630173191395897,
          114.05241966247559
        ],
        [
          22.631321911211117,
          114.048171043396
        ]
      ],
      defaultBox:
       [
         [
           22.64039249935804,
           114.04400825500488
         ],
         [
           22.623161831305342,
           114.04422283172607
         ],
         [
           22.624587899615936,
           114.061861038208
         ],
         [
           22.640709364974562,
           114.06516551971434
         ],
         [
           22.64039249935804,
           114.04400825500488
         ]
       ]
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
        center: this.defaultPoint,
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
      this.addMarker()
      this.addLine()
      this.addBox()
      this.addCircle()
    },
    addMarker () {
      const point = this.defaultPoint
      // drawMarker(this.$L, this.mapView, point)
      const marker = this.$L.marker(point, { icon: this.createIcion() }).addTo(this.mapView)
      console.log(marker)
      // this.mapView.setView(point, 17, {})
    },
    addLine () {
      const line = this.defaultLine
      const polyline = this.$L.polyline(line, { color: 'blue' }).addTo(this.mapView)
      console.log(polyline)
      // this.mapView.fitBounds(polyline.getBounds())
    },
    addBox () {
      const box = this.defaultBox
      const polygon = this.$L.polygon(box, { color: 'red' }).addTo(this.mapView)
      console.log(polygon)
      // this.mapView.fitBounds(polygon.getBounds())
    },
    addCircle () {
      const circlePoint = this.defaultPoint
      const circle = this.$L.circle(circlePoint, { radius: 100 }).addTo(this.mapView)
      console.log(circle)
      // this.mapView.fitBounds(circle.getBounds())
    },
    createIcion () {
      return this.$L.icon({
        iconUrl: require('@/assets/img/dian.png'),
        iconSize: [20, 20],
        // iconAnchor: [0, 0],
        popupAnchor: [-3, -76]
      })
    },
    geoJSON () {

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
