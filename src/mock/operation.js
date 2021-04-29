/* eslint-disable */
import $, { map } from 'jquery'
import Vue from 'vue/dist/vue.esm.js'

import Draw from './draw'
import transformation from '@/js/coordinateTransformation'
import * as turf from '@turf/turf'

const mapIcon = {
  marker_red: 'images/marker_red.png',
  marker_blue: 'images/marker_blue.png',
  fm_red: 'images/fm_red.png',
  fm_blue: 'images/fm_blue.png',
  fm_green: 'images/fm_green.png',
  xhs_red: 'images/xhs_red.png',
  xhs_blue: 'images/xhs_blue.png',
  xhs_green: 'images/xhs_green.png',
  qdd_red: 'images/qdd_red.png',
  qdd_green: 'images/qdd_green.png',
  on_line: 'images/on_line.png',
  off_line: 'images/off_line.png',
  v_yellow: 'images/v_yellow.png',
  'v-blue': 'images/v-blue.png',
  ldfb_red: 'images/ldfb_red.png',
  ldfb_blue: 'images/ldfb_blue.png',
  ldfb_green: 'images/ldfb_green.png',
  ldfb_yellow: 'images/ldfb_yellow.png',
  xyjc_blue: 'images/xyjc_blue.png',
  xyjc_red: 'images/xyjc_red.png'
}

/*
 * @Author: lingyx
 * @Date: 2020-06-02
 * @Description: 构造地图操作类
 */
class Operation {
  constructor (map) {
    this.topicManager = window.topicManager
    this.map = map
    // 绘制图层
    this.geoJSON = new L.geoJSON()
    this.geoJSON.addTo(this.map)
    // 高亮图层
    this.selectedLayer = new L.geoJSON()
    this.selectedLayer.addTo(this.map)

    // 注记专题图层保存
    this.labelLayer = {
      1: [],
      2: [],
      3: []
    }
    // 图层查询数据源
    this.layerRelation = {
      GS_CONVALVE: '控制阀',
      GS_HYDRANT: '消火栓'
    }

    this.editableLayers = new L.FeatureGroup()
    this.editableLayers.addTo(map)

    this.geoInfoLayer = new L.FeatureGroup()
    map.addLayer(this.geoInfoLayer)

    // 矢量图层组
    this.vectorLayer = new L.FeatureGroup()
    map.addLayer(this.vectorLayer)

    this.toolbar = new Draw(map)

    // 热力图
    this.heatMapLayer

    // 业务系统中需要通信的回调函数
    this.systemCallback = ''
    // 业务系统中需要通信的iframe
    this.systemIframe = ''
    // 当前几何类型
    this.geometryType = ''
    // 需要查询的图层
    this.queryLayer = ''
  }

  /**
 * 获取单值专题图层
 * @param field   单值专题图层字段   超图bug需大写传入！ 例子"P_CODE"
 * @param styleGroups 字段值与对应颜色值  例：[
      {
        value: 'C02100201',
        style: {
          fillColor: "#666"
        }
      }, {
        value: "C02100202",
        style: {
          fillColor: "#ccc"
        }
      }, {
        value: "C02100203",
        style: {
          fillColor: "#ccc524"
        }
      }]
 */
  adduniqueThemeLayer (field, styleGroups) {
    const themeLayer = L.supermap.uniqueThemeLayer('ThemeLayer', {
      // 开启 hover 高亮效果
      isHoverAble: true,
      opacity: 0.8,
      alwaysMapCRS: true,
      nodesClipPixel: 6
    })
    // 图层基础样式
    themeLayer.style = new SuperMap.ThemeStyle({
      shadowBlur: 3,
      shadowColor: '#000000',
      shadowOffsetX: 1,
      shadowOffsetY: 1,
      fillColor: '#FFFFFF'
    })
    // hover 高亮样式
    themeLayer.highlightStyle = new SuperMap.ThemeStyle({
      stroke: true,
      strokeWidth: 2,
      strokeColor: 'red',
      fillColor: '#00F5FF',
      fillOpacity: 0.2
    })
    // 用于单值专题图的属性字段名称
    themeLayer.themeField = field
    // 风格数组，设定值对应的样式
    themeLayer.styleGroups = styleGroups

    return themeLayer
  }

  /**
 * sql数据服务查询
 * @param datasetNames 数组，value为字符串‘数据源:数据集'  例：["DataSource:ST_DMA"]
 * @param attributeFilter sql语句   设置搜索条件   例："RANK = 'W101640001'"
 * @param toIndex 查询数目
 * @param url   数据服务  例：'http://10.13.1.36:8090/iserver/services/data-GS_MeizhouWorkspace/rest/data'
 */
  getFeatureBySQL (datasetNames, attributeFilter, toIndex = 100000, url) {
    if (!url) {
      url = window.config.services.mapServices.Data.url
    }
    // let url = 'http://10.13.1.36:8090/iserver/services/data-GS_MeizhouWorkspace/rest/data'
    const p = new Promise((resolve, reject) => {
      var getFeatureBySQLParams = new SuperMap.GetFeaturesBySQLParameters({
        queryParameter: new SuperMap.FilterParameter({
          name: '', // ?查询数据服务   此name无效
          attributeFilter
        }),
        toIndex: toIndex,
        datasetNames
      })
      getFeatureBySQLParams.maxFeatures = 26000
      L.supermap.featureService(url)
        .getFeaturesBySQL(getFeatureBySQLParams, (serviceResult) => {
          resolve(serviceResult)
        }
          // , SuperMap.DataFormat.ISERVER
        )
    })
    return p
  }

  /**
 * 展示虚拟分区(合并)
 * @param Region   分区code，["C2151244","C2151244"]
 * @param popupContent 弹窗内容  例："<div>6565</div>"  or "id:65"
 * @param popupOption 弹窗设置  若无特殊设置传{}
 * @param onClick 点击回调  例：()=>{alert("click")}
 * @param onHover 鼠标覆盖回调  例：()=>{alert("click")}
 * @param onOut 鼠标移出回调  例：()=>{alert("click")}
 */
  showUnionRegion (Region, popupContent = '', popupOption = {}, onClick = () => { }, onHover = () => { }, onOut = () => { }) {
    this._removeLayers()
    const geoJSON = new L.geoJSON()
    geoJSON.operationLayer = true
    geoJSON.addTo(this.map)
    const dma_geoJson = this.topicManager.getLayer('LOCAL_DMA').geoJson

    const RegionCOR = []
    for (const value of dma_geoJson.features) {
      if (Region.includes(value.properties.p_code)) {
        RegionCOR.push(value.geometry.coordinates)
      }
    }

    const resGeoJson = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'MultiPolygon',
        coordinates: RegionCOR
      }
    }
    geoJSON.addData(resGeoJson)
    this.map.fitBounds(geoJSON.getBounds(), { padding: L.point(50, 50) })
    geoJSON.setStyle((feature) => {
      return {
        fillColor: '#999',
        weight: 4,
        opacity: 1,
        color: 'red'
        // dashArray: "3",
        // fillOpacity: 0.7
      }
    })
    geoJSON.eachLayer((layer) => {
      layer.on({
        mouseover: onHover,
        mouseout: onOut,
        click: onClick
      })
      //   layer.bindPopup(`<div>55</div><br><div>4564</div>`);
      layer.bindPopup(popupContent, popupOption)
      if (popupContent != '') {
        layer.openPopup()
      }
      //   layer.bindPopup(popupContent,popupOption).openPopup();
    })
  }

  /**
   * 展示分区or虚拟分区
   * @param baseRegion  分区编号  "C2151244"
   * @param cutRegion   挖去分区，["C2151244","C2151244"]
   * @param popupContent 弹窗内容  例："<div>6565</div>"  or "id:65"
   * @param popupOption 弹窗设置  若无特殊设置传{}
   * @param onClick 点击回调  例：()=>{alert("click")}
   * @param onHover 鼠标覆盖回调  例：()=>{alert("click")}
   * @param onOut 鼠标移出回调  例：()=>{alert("click")}
   */
  showRegion (baseRegion, cutRegion = [], popupContent = '', popupOption = {}, onClick = () => { }, onHover = () => { }, onOut = () => { }) {
    this._removeLayers()
    const geoJSON = new L.geoJSON()
    geoJSON.operationLayer = true
    geoJSON.addTo(this.map)
    const dma_geoJson = this.topicManager.getLayer('LOCAL_DMA').geoJson

    let baseRegionCOR; const cutRegionCOR = []
    console.log(baseRegion)
    for (const value of dma_geoJson.features) {
      if (value.properties.p_code == baseRegion) {
        console.log('匹配到')
        console.log(value)
        baseRegionCOR = value.geometry.coordinates
      }
      if (cutRegion.includes(value.properties.p_code)) {
        cutRegionCOR.push(value.geometry.coordinates)
      }
    }

    if (!baseRegionCOR) {
      console.log('未找到该分区编码')
      parent.window.toast('未找到该分区编码')
      return
    }
    cutRegionCOR.unshift(baseRegionCOR)
    const resGeoJson = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'MultiPolygon',
        coordinates: cutRegionCOR
      }
    }

    console.log(resGeoJson)
    geoJSON.addData(resGeoJson)
    this.map.fitBounds(geoJSON.getBounds(), { padding: L.point(50, 50) })
    geoJSON.setStyle((feature) => {
      return {
        fillColor: '#c3c0c0',
        weight: 4,
        opacity: 1,
        color: 'red'
        // dashArray: "3",
        // fillOpacity: 0.7
      }
    })
    geoJSON.eachLayer((layer) => {
      layer.on({
        mouseover: onHover,
        mouseout: onOut,
        click: onClick
      })
      //   layer.bindPopup(`<div>55</div><br><div>4564</div>`);
      layer.bindPopup(popupContent, popupOption)
      if (popupContent != '') {
        layer.openPopup()
      }
      //   layer.bindPopup(popupContent,popupOption).openPopup();
    })
  }

  /**
   * 获取geoJson对象
   * @param geometryType 几何类型(Point/LineString/MultiLineString/Polygon/MultiPolygon)
   * @param coordinates  坐标
   * @param layerId 图层id
   * @param attributes 属性信息
   */
  getGeoJsonObject (geometryType, coordinates, layerId, attributes) {
    const geoJsonObj = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          layerId: layerId || 'vectorLayerId',
          properties: attributes || {},
          geometry: {
            type: geometryType,
            coordinates: coordinates
          }
        }
      ]
    }
    return geoJsonObj
  }

  /**
   * 添加点和弹框
   * @param coordinate  一维数组 例[454532,95957]
   * @param popupContent 弹窗内容  例："<div>6565</div>"  or "id:65"
   * @param popupOption 弹窗设置  若无特殊设置传{}
   * @param onClick 点击回调  例：()=>{alert("click")}
   * @param onHover 鼠标覆盖回调  例：()=>{alert("click")}
   * @param onOut 鼠标移出回调  例：()=>{alert("click")}
   */
  addPoint (coordinate, popupContent = '', popupOption = { maxHeight: 280 }, onClick = () => { }, onHover = () => { }, onOut = () => { }, classSymbol, pictureSymbol) {
    this._removeLayers()
    const geoJSON = new L.geoJSON()
    geoJSON.operationLayer = true
    geoJSON.addTo(this.map)
    const pointObj = this.getGeoJsonObject('Point', coordinate)
    const point = transForm.normal(new L.geoJSON(pointObj), true)
    geoJSON.addData(point)
    geoJSON.eachLayer((layer) => {
      layer.on({
        mouseover: onHover,
        mouseout: onOut,
        click: onClick
      })
      layer.bindPopup(popupContent, popupOption)
      if (popupContent != '') {
        layer.openPopup()
      }
      // 以classSymbol为优先
      if (classSymbol) {
        layer.setIcon(
          L.divIcon({
            className: classSymbol
          })
        )
      } else if (pictureSymbol) {
        layer.setIcon(
          L.icon({
            iconUrl: 'images/v-blue.png',
            iconSize: [12, 12]
            // iconAnchor: [22, 94],
            // popupAnchor: [0, 0],
            // shadowUrl: "images/marker-shadow.png",
            // shadowSize: [12, 12],
            // shadowAnchor: [22, 94]
          })
        )
      }
      //   layer.bindPopup(popupContent,popupOption).openPopup();
    })
    const [lat, lng] = transForm.PointArr(coordinate, true)
    this.map.setView(L.latLng(lat, lng), 8)
  }

  /**
   * 添加线和弹框
   * @param coordinate
   * @param popupContent 弹窗内容  例："<div>6565</div>"  or "id:65"
   * @param popupOption 弹窗设置  若无特殊设置传{}
   * @param onClick 点击回调  例：()=>{alert("click")}
   * @param onHover 鼠标覆盖回调  例：()=>{alert("click")}
   * @param onOut 鼠标移出回调  例：()=>{alert("click")}
   */
  addLine (coordinate, popupContent = '', popupOption = { maxHeight: 280 }, onClick = () => { }, onHover = () => { }, onOut = () => { }, pointTo = true) {
    this._removeLayers()
    const geoJSON = new L.geoJSON()
    geoJSON.operationLayer = true

    geoJSON.addTo(this.map)
    const geoJsonObj = this.getGeoJsonObject('LineString', coordinate)
    const line = transForm.normal(new L.geoJSON(geoJsonObj), true)
    this.map.fitBounds(new L.geoJSON(line).getBounds(), { padding: L.point(200, 200) })
    geoJSON.addData(line)
    geoJSON.setStyle((feature) => {
      return {
        weight: 4,
        opacity: 1,
        color: 'red'
      }
    })
    geoJSON.eachLayer((layer) => {
      layer.on({
        mouseover: onHover,
        mouseout: onOut,
        click: onClick
      })
      layer.bindPopup(popupContent, popupOption)
      if (popupContent != '') {
        layer.openPopup()
      }
    })
  }

  /**
   * 添加面和弹框
   * @param coordinate
   * @param popupContent 弹窗内容  例："<div>6565</div>"  or "id:65"
   * @param popupOption 弹窗设置  若无特殊设置传{}
   * @param onClick 点击回调  例：()=>{alert("click")}
   * @param onHover 鼠标覆盖回调  例：()=>{alert("click")}
   * @param onOut 鼠标移出回调  例：()=>{alert("click")}
   */
  addPolygon (coordinate, popupContent = '', popupOption = { maxHeight: 280 }, onClick = () => { }, onHover = () => { }, onOut = () => { }) {
    this._removeLayers()
    const geoJSON = new L.geoJSON()
    geoJSON.operationLayer = true
    geoJSON.addTo(this.map)
    const geoJsonObj = this.getGeoJsonObject('Polygon', coordinate)

    const polygon = transForm.normal(new L.geoJSON(geoJsonObj), true)
    this.map.fitBounds(new L.geoJSON(polygon).getBounds(), { padding: L.point(50, 50) })
    geoJSON.addData(polygon)
    geoJSON.setStyle((feature) => {
      return {
        fillColor: '#999',
        weight: 4,
        opacity: 1,
        color: 'red'
        // dashArray: "3",
        // fillOpacity: 0.7
      }
    })
    geoJSON.eachLayer((layer) => {
      layer.on({
        mouseover: onHover,
        mouseout: onOut,
        click: onClick
      })
      layer.bindPopup(popupContent, popupOption)
      if (popupContent != '') {
        layer.openPopup()
      }
    })
  }

  addMultiPolygon (coordinate, popupContent = '', popupOption = { maxHeight: 280 }, onClick = () => { }, onHover = () => { }, onOut = () => { }) {
    this._removeLayers()
    const geoJSON = new L.geoJSON()
    geoJSON.operationLayer = true
    geoJSON.addTo(this.map)
    const geoJsonObj = this.getGeoJsonObject('MultiPolygon', coordinate)
    const polygon = transForm.normal(new L.geoJSON(geoJsonObj), true)
    this.map.fitBounds(new L.geoJSON(polygon).getBounds(), { padding: L.point(50, 50) })
    geoJSON.addData(polygon)
    geoJSON.setStyle((feature) => {
      return {
        fillColor: '#999',
        weight: 4,
        opacity: 1,
        color: 'red'
        // dashArray: "3",
        // fillOpacity: 0.7
      }
    })
    geoJSON.eachLayer((layer) => {
      layer.on({
        mouseover: onHover,
        mouseout: onOut,
        click: onClick
      })
      layer.bindPopup(popupContent, popupOption)
      if (popupContent != '') {
        layer.openPopup()
      }
    })
  }

  /**
  * 添加点
  * 注：适用于循环渲染多个点
  * @param coordinate  坐标
  * @param pointIcon 图标 mapIcon对象的key
  * @param layerId 图层id
  * @param attributes 属性信息
  * @param size 图标大小 [18,26]
  * @param labelText 标注内容
  */
  addSpecialPoint (coordinate, pointIcon, layerId, attributes, size, labelText) {
    const customLayerId = layerId || 'specialPointLayer'
    const specialPointLayer = new L.geoJSON()
    specialPointLayer.layerId = customLayerId
    specialPointLayer.addTo(this.vectorLayer)
    const markerIcon = pointIcon ? mapIcon[pointIcon] : 'images/marker_red.png'
    const geoJsonObj = this.getGeoJsonObject('Point', coordinate, customLayerId, attributes)
    const point = transForm.normal(new L.geoJSON(geoJsonObj), true)
    specialPointLayer.addData(point)
    specialPointLayer.eachLayer((layer) => {
      layer.setIcon(
        L.icon({
          iconUrl: markerIcon,
          iconSize: size ? [size[0], size[1]] : [18, 26], // 设置icon大小
          iconAnchor: size ? [size[0] / 2, size[1] / 2] : [9, 26] // 图标偏移
        })
      )
    })
    if (labelText) {
      const marker = L.divIcon({
        html: '<span style="color:#fff">' + labelText + '</span>', // marker标注
        className: 'my-div-icon',
        iconSize: size ? [size[0], size[1]] : [18, 26],
        iconAnchor: size ? [size[0] / 2, size[1] / 2] : [9, 26] // 文字标注相对位置
      })
      const [lat, lng] = transForm.PointArr(coordinate, true)
      L.marker([lat, lng], { icon: marker }).addTo(specialPointLayer)
    }
  }

  /**
  * 添加线
  * 注：适用于循环渲染多条线
  * @param coordinate  坐标
  * @param layerId 图层id
  * @param attributes 属性信息
  */
  addSpecialLine (coordinate, layerId, attributes) {
    const customLayerId = layerId || 'specialLineLayer'
    const specialLineLayer = new L.geoJSON()
    specialLineLayer.layerId = customLayerId
    specialLineLayer.addTo(this.vectorLayer)
    const geoJsonObj = this.getGeoJsonObject('LineString', coordinate, customLayerId, attributes)
    const line = transForm.normal(new L.geoJSON(geoJsonObj), true)
    specialLineLayer.addData(line)
    specialLineLayer.eachLayer((layer) => {
      return {
        weight: 3,
        opacity: 1,
        color: 'red'
      }
    })
  }

  /**
   * 添加面
   * 注：适用于循环渲染多个面
   * @param coordinate 坐标
   * @param layerId 图层id
   * @param attributes 属性信息
   */
  addSpecialPolygon (coordinate, layerId, attributes) {
    const color = layerId ? '#ff0000' : '#01C801'
    const specialAreaLayer = new L.geoJSON()
    const customLayerId = layerId || 'specialAreaLayer'
    specialAreaLayer.layerId = customLayerId
    specialAreaLayer.addTo(this.vectorLayer)
    const geoJsonObj = this.getGeoJsonObject('Polygon', coordinate, customLayerId, attributes)
    const polygon = transForm.normal(new L.geoJSON(geoJsonObj), true)
    this.map.fitBounds(new L.geoJSON(polygon).getBounds(), { padding: L.point(50, 50) })
    specialAreaLayer.addData(polygon)
    specialAreaLayer.setStyle((feature) => {
      return {
        fillColor: color,
        weight: 1,
        opacity: 1,
        color: color,
        fillOpacity: 0.2
      }
    })
  }

  /**
  * 点定位
  * @param coordinate
  * @param pointIcon 图标 mapIcon对象的key
  */
  setPointLocation (coordinate, pointIcon) {
    this._removeSpecialLayers(['locationLayer'])
    const locationLayer = new L.geoJSON()
    const layerId = 'locationLayer'
    locationLayer.layerId = layerId
    locationLayer.addTo(this.map)
    const markerIcon = pointIcon ? mapIcon[pointIcon] : 'images/marker_red.png'
    const geoJsonObj = this.getGeoJsonObject('Point', coordinate, layerId)
    const point = transForm.normal(new L.geoJSON(geoJsonObj), true)
    locationLayer.addData(point)
    locationLayer.eachLayer((layer) => {
      layer.setIcon(
        L.icon({
          iconUrl: markerIcon,
          iconSize: [18, 26], // 设置icon大小
          iconAnchor: [9, 26] // 图标偏移
        })
      )
    })
    const [lat, lng] = transForm.PointArr(coordinate, true)
    this.map.setView(L.latLng(lat, lng), this.getBaseMaxZoom())
  }

  /**
  * 线定位
  * @param coordinate
  */
  setLineLocation (coordinate) {
    this._removeSpecialLayers(['locationLayer'])
    const locationLayer = new L.geoJSON()
    const layerId = 'locationLayer'
    locationLayer.layerId = layerId
    locationLayer.addTo(this.map)
    const geoJsonObj = this.getGeoJsonObject('LineString', coordinate, layerId)
    const line = transForm.normal(new L.geoJSON(geoJsonObj), true)
    this.map.fitBounds(new L.geoJSON(line).getBounds(), { padding: L.point(50, 50) })
    locationLayer.addData(line)
    locationLayer.setStyle((feature) => {
      return {
        weight: 3,
        opacity: 1,
        color: 'red'
      }
    })
  }

  /**
  * 面定位
  * @param coordinate
  */
  setPolygonLocation (coordinate) {
    this._removeSpecialLayers(['locationLayer'])
    const layerId = 'locationLayer'
    const locationLayer = new L.geoJSON()
    locationLayer.layerId = layerId
    locationLayer.addTo(this.map)
    const geoJsonObj = this.getGeoJsonObject('Polygon', coordinate, layerId)
    const polygon = transForm.normal(new L.geoJSON(geoJsonObj), true)
    this.map.fitBounds(new L.geoJSON(polygon).getBounds(), { padding: L.point(50, 50) })
    locationLayer.addData(polygon)
    locationLayer.setStyle((feature) => {
      return {
        fillColor: '#999',
        weight: 2,
        opacity: 1,
        color: 'red'
      }
    })
  }

  /**
   * 设置高亮
   * @param cor  e二维数组 例[[454532,95957]]  若不传则表示清空高亮
   */
  addHeightLineLayer (cor, save = false) {
    if (!save) {
      this.selectedLayer.clearLayers()
    }

    if (cor) {
      const lineGeo = this.getGeoJsonObject('LineString', cor)
      this.selectedLayer.addData(lineGeo)
      this.selectedLayer.eachLayer(function (layer) {
        layer.setStyle({
          color: '#FF0000'
        })
      })
    }
  }

  /**
   * 判断专题图ID是否仍然有效
   * @param layer  图层URL
   * @param layerId  要判断的专题图ID
   */
  ifThemeLayerIDAvailable (layer, layerId) {
    const p = new Promise((reslove, reject) => {
      if (layerId == null) {
        reject(false)
        return
      }
      const checkUrl = layer + '.jsonp/tileImage.json?callback=callback&layersID=' + layerId
      $.ajax({
        url: checkUrl,
        type: 'GET',
        dataType: 'json', // 指定服务器返回的数据类型
        jsonpCallback: 'callback', // 指定回调函数名称
        success: function (data) {
          reslove(true)
        },
        error: function (err) {
          reject(false)
        }
      })
    })
    return p
  }

  /**
   * 分区图层注记控制
   * @param level  分区等级
   * @param option  "open","close"  控制开关
   */
  regionLable (level, option, Arr = []) {
    console.log('change')
    const _this = this
    const server = window.config.services.mapServices.ST_DMA
    topicManager.closeLayer('ST_DMA', [level + ''])
    // topicManager.closeLayer('ST_DMA', [level + ''])

    // topicManager.closeLayer('ST_DMA', [level + ''])

    // topicManager.closeLayer('ST_DMA', [level + ''])

    // topicManager.closeLayer('ST_DMA', ["2"])
    // topicManager.closeLayer('ST_DMA', ["3"])

    // for(let key in _this.labelLayer){
    _this.labelLayer[level + ''].forEach((layer, index) => {
      _this.map.removeLayer(layer)
    })
    // }
    switch (level) {
      case 1: {
        if (option == 'open') {
          if (Arr.length > 0) {
            const url = server.url
            const arrString = "'" + Arr.join("' , '") + "'"
            const layerStatus = [new SuperMap.LayerStatus({
              layerName: 'ST_DMA@DataSource',
              isVisible: false
            }
            ), new SuperMap.LayerStatus({
              layerName: 'ST_DMA@DataSource#1',
              isVisible: true,
              displayFilter: `p_code in (${arrString})`
            }
            ), new SuperMap.LayerStatus({
              layerName: 'ST_DMA@DataSource#2',
              isVisible: false
            }
            ), new SuperMap.LayerStatus({
              layerName: 'ST_DMA@DataSource#3',
              isVisible: false
            }
            )]
            const params = new SuperMap.SetLayerStatusParameters({
              layerStatusList: layerStatus
            })
            const callback = function (createTempLayerEventArgs) {
              const tempLayerID = createTempLayerEventArgs.result.newResourceID
              const layer = L.supermap.tiledMapLayer(url, {
                layersID: tempLayerID
              })
              layer.addTo(_this.map)
              _this.labelLayer['1'].push(layer)
            }
            L.supermap.layerInfoService(url).setLayerStatus(params, callback)
          } else {
            topicManager.openLayer('ST_DMA', ['1'])
          }
        } else if (option == 'close') {
          topicManager.closeLayer('ST_DMA', ['1'])
        }
        break
      }
      case 2: {
        if (option == 'open') {
          if (Arr.length > 0) {
            const url = server.url
            const arrString = "'" + Arr.join("' , '") + "'"
            const layerStatus = [new SuperMap.LayerStatus({
              layerName: 'ST_DMA@DataSource',
              isVisible: false,
              displayFilter: "p_code = 'C021002L2017'"
            }
            ), new SuperMap.LayerStatus({
              layerName: 'ST_DMA@DataSource#1',
              isVisible: false,
              displayFilter: "p_code = 'C021002L2017'"
            }
            ), new SuperMap.LayerStatus({
              layerName: 'ST_DMA@DataSource#2',
              isVisible: true,
              displayFilter: `p_code in (${arrString})`
            }
            ), new SuperMap.LayerStatus({
              layerName: 'ST_DMA@DataSource#3',
              isVisible: false,
              displayFilter: "p_code = 'C021002L2017'"
            }
            )]

            const params = new SuperMap.SetLayerStatusParameters({
              layerStatusList: layerStatus
            })
            const callback = function (createTempLayerEventArgs) {
              const tempLayerID = createTempLayerEventArgs.result.newResourceID

              const layer = L.supermap.tiledMapLayer(url, {
                layersID: tempLayerID
              })
              layer.addTo(_this.map)
              _this.labelLayer['2'].push(layer)
            }
            L.supermap.layerInfoService(url).setLayerStatus(params, callback)
          } else {
            topicManager.openLayer('ST_DMA', ['2'])
          }
        } else if (option == 'close') {
          topicManager.closeLayer('ST_DMA', ['2'])
        }
        break
      }
      case 3: {
        if (option == 'open') {
          if (Arr.length > 0) {
            const url = server.url
            const arrString = "'" + Arr.join("' , '") + "'"
            const layerStatus = [new SuperMap.LayerStatus({
              layerName: 'ST_DMA@DataSource',
              isVisible: false
            }
            ), new SuperMap.LayerStatus({
              layerName: 'ST_DMA@DataSource#1',
              isVisible: false
            }
            ), new SuperMap.LayerStatus({
              layerName: 'ST_DMA@DataSource#2',
              isVisible: false
            }
            ), new SuperMap.LayerStatus({
              layerName: 'ST_DMA@DataSource#3',
              isVisible: true,
              displayFilter: `p_code in (${arrString})`

            }
            )]
            const params = new SuperMap.SetLayerStatusParameters({
              layerStatusList: layerStatus
            })
            const callback = function (createTempLayerEventArgs) {
              const tempLayerID = createTempLayerEventArgs.result.newResourceID
              const layer = L.supermap.tiledMapLayer(url, {
                layersID: tempLayerID
              })
              layer.addTo(_this.map)
              _this.labelLayer['3'].push(layer)
            }
            L.supermap.layerInfoService(url).setLayerStatus(params, callback)
          } else {
            topicManager.openLayer('ST_DMA', ['3'])
          }
        } else if (option == 'close') {
          topicManager.closeLayer('ST_DMA', ['3'])
        }
        break
      }
    }
  }

  // 删除图层
  _removeLayers () {
    const _this = this
    this.map.eachLayer(function (layer) {
      if (layer.operationLayer) { _this.map.removeLayer(layer) }
    })
  }

  /**
  * 清除特定图层标记
  * @param layerIds  图层id数组  例["layerId1","layerId2"]
  */
  _removeSpecialLayers (layerIds) {
    const _this = this
    for (let i = 0; i < layerIds.length; i++) {
      _this.map.eachLayer(function (layer) {
        if (layer.layerId == layerIds[i]) {
          _this.map.removeLayer(layer)
        }
      })
    }
  }

  _hello (hello) {
    console.log('map is ready' + hello)
  }

  _createPolygon (res) {
    // let result = res.data.dataList
    const data = {
      type: 'FeatureCollection',
      features: [
      ]
    }
    for (const value of res.data.dataList) {
      const clone = JSON.parse(JSON.stringify(value))
      delete clone.smgeometry
      data.features.push(
        {
          type: 'Feature',
          properties: clone,
          geometry: {
            type: 'Polygon',
            coordinates: value.smgeometry
          }
        })
    }
    return data
  }

  _createLine (res) {
    const data = {
      type: 'FeatureCollection',
      features: [
      ]
    }
    for (const value of res.data.dataList) {
      const clone = JSON.parse(JSON.stringify(value))
      delete clone.smgeometry
      data.features.push(
        {
          type: 'Feature',
          properties: clone,
          geometry: {
            type: 'LineString',
            coordinates: value.smgeometry
          }
        })
    }
    return data
  }

  _createPoint (res) {
    const data = {
      type: 'FeatureCollection',
      features: [
      ]
    }
    for (const value of res.data.dataList) {
      const clone = JSON.parse(JSON.stringify(value))
      delete clone.smgeometry
      data.features.push(
        {
          type: 'Feature',
          properties: clone,
          geometry: {
            type: 'Point',
            coordinates: value.smgeometry
          }
        })
    }
    return data
  }

  getColorByData (data) {
    // data = [1,2,3,4,5]
    var max = Math.max.apply(null, data)
    var min = Math.min.apply(null, data)
    const result = data.map(v => {
      if (v || v === 0) {
        return getColorByNumber(v - min, max)
        // return "#ccc"
      } else {
        return '#ccc'
      }
    })

    function rgbaToHex (color) {
      var values = color
        .replace(/rgba?\(/, '')
        .replace(/\)/, '')
        .replace(/[\s+]/g, '')
        .split(',')
      var a = parseFloat(values[3] || 1)
      var r = Math.floor(a * parseInt(values[0]) + (1 - a) * 255)
      var g = Math.floor(a * parseInt(values[1]) + (1 - a) * 255)
      var b = Math.floor(a * parseInt(values[2]) + (1 - a) * 255)
      return '#' +
        ('0' + r.toString(16)).slice(-2) +
        ('0' + g.toString(16)).slice(-2) +
        ('0' + b.toString(16)).slice(-2)
    }
    function getColorByNumber (n, max) {
      const halfMax = (max - min) / 1.8
      var one = 255 / halfMax
      console.log('one= ' + one)
      var r = 0
      var g = 0
      var b = 0
      // if (n < halfMax) {
      if (true) {
        r = one * n
        g = 60
      }
      // if (n >= halfMax) {
      // if (true) {
      //   g = (255 - ((n - halfMax) * one)) < 0 ? 0 : (255 - ((n - halfMax) * one))
      //   r = 255;
      // }
      r = parseInt(r)// 取整
      g = parseInt(g)// 取整
      b = parseInt(b)// 取整

      // console.log(r,g,b)
      return rgbaToHex('rgb(' + r + ',' + g + ',' + b + ')')
      // return [r, g, b];
    }
    return result
  }

  // 鼠标设置十字架选取样式
  changeMouse () {
    const container = this.map.getContainer()
    container.style.cursor = 'crosshair'
  }

  // 恢复鼠标默认样式
  returnMouse () {
    const container = this.map.getContainer()
    container.style.cursor = 'default'
  }

  // 关闭绘制工具
  deactiveToolbar () {
    this.returnMouse()
    this.toolbar.deactivated()
  }

  /**
   * 激活绘制工具
   * @param geometryType  几何类型(多边形："polygon"，点："point")
   * @param systemCallback  业务系统中的回调函数
   * @param systemIframe  业务系统中的需要通信的iframe
   */
  activeToolbar (geometryType, systemCallback, systemIframe) {
    this.changeMouse()
    this.toolbar.deactivated()
    this.toolbar.activate(geometryType, this.showPopupInfo.bind(this))
    this.systemCallback = systemCallback
    this.systemIframe = systemIframe
    this.geometryType = geometryType
  }

  /**
  * 服务查询
  * @param geometryType  几何类型(多边形："polygon"，点："point")
  * @param systemCallback  业务系统中的回调函数
  * @param systemIframe  业务系统中的需要通信的iframe
  * @param systemIframe  需要查询的图层
  */
  activeGeometryQuery (geometryType, systemCallback, systemIframe, queryLayer) {
    this.changeMouse()
    this.toolbar.deactivated()
    this.toolbar.activate(geometryType, this.getQueryResult.bind(this))
    this.systemCallback = systemCallback
    this.systemIframe = systemIframe
    this.geometryType = geometryType
    this.queryLayer = queryLayer
  }

  /**
   * 编辑区域/签到点
   * @param geometryType  几何类型(多边形："polygon"，点："point")
   * @param systemCallback  业务系统中的回调函数
   * @param systemIframe  业务系统中的需要通信的iframe
   */
  editToolbar (dataInfo, geometryType, systemCallback, systemIframe) {
    this.systemCallback = systemCallback
    this.systemIframe = systemIframe
    this.geometryType = geometryType
    if (geometryType == 'polygon') { // 区域
      const coordinate = JSON.parse(dataInfo.coordinate)
      const geoJsonObj = this.getGeoJsonObject('Polygon', coordinate)
      const polygon = transForm.normal(new L.geoJSON(geoJsonObj), true)// 投影转经纬度
      const dataArry = polygon.features[0].geometry.coordinates[0]// 转换后的坐标格式为[lng,lat]
      const points = []
      for (let i = 0; i < dataArry.length; i++) {
        points.push([dataArry[i][1], dataArry[i][0]])// 调整坐标格式为[lat,lng]
      }
      this.showPopupInfo(L.polygon([points]), points, dataInfo).bind(this)
    } else { // 签到点
      const coordinate = dataInfo.coordinate.split(',')
      const [lat, lng] = transForm.PointArr(coordinate, true)
      const markerIcon = L.icon({
        iconUrl: mapIcon.qdd_red,
        iconSize: [18, 26], // 设置icon大小
        iconAnchor: [9, 26], // 图标偏移
        popupAnchor: [-9, -40] // 弹框偏移
      })
      const point = L.marker([lat, lng], { icon: markerIcon })
      this.showPopupInfo(point, [lat, lng], dataInfo).bind(this)
    }
  }

  /**
   * 弹框展示巡查/检漏区域、签到点等信息
   * @param layer  几何对象
   * @param point  坐标信息
   * @param dataInfo  表单信息
   */
  showPopupInfo (layer, point, dataInfo) {
    const _this = this
    layer.addTo(_this.editableLayers)
    let centerPoint = ''
    let name = '未命名'
    let importance = 'GW007001'
    _this.deactiveToolbar()
    if (dataInfo) { // 修改
      if (_this.geometryType == 'polygon') { // 区域
        layer.editing.enable()// 开启几何编辑模式
        centerPoint = layer.getCenter()
      }
      name = dataInfo.name
      importance = dataInfo.importance
      openPopup()
    } else { // 新增
      if (_this.geometryType == 'polygon') { // 区域
        layer.editing.enable()// 开启几何编辑模式
        centerPoint = layer.getCenter()
        openPopup()
      } else { // 签到点
        _this.getAdress(point[1], point[0]).then(function (thisAddress) {
          name = thisAddress
          openPopup()
        }).catch(function (e) {
          openPopup()
        })
      }
    }
    function openPopup () {
      const content = `<div class="pop-box">
                        <b class="pop-box-title">新增</b>
                        <div class="content-item">
                          <span>名称：</span>
                          <textarea type="text" class="content-name">${name}</textarea>
                        </div>
                        <div class="import-item">
                          <label>重要性：</label>
                          <label><input type="radio" value="GW007002" name="importance" ${(importance == 'GW007002' ? 'checked' : '')}><span>是</span></label>
                          <label><input type="radio" value="GW007001" name="importance" ${(importance == 'GW007001' ? 'checked' : '')}><span>否</span></label>
                        </div>
                        <div class="btn-con">
                          <button id="btnOk">确认</button>
                          <button id="btnCancel">取消</button>
                        </div>
                    </div>`
      layer.bindPopup(content, {
        keepInView: false,
        autoClose: true,
        closeOnClick: false,
        className: 'popup-style',
        minWidth: 300
      }).openPopup(centerPoint)
      layer.on('popupclose', function () {
        this.remove()
        _this.deactiveToolbar()
        window.executeSystemFun(_this.systemIframe, _this.systemCallback, null)
      })
      $('#btnOk').off('click').on('click', function () {
        _this.deactiveToolbar()
        const newGeo = transForm.normal(layer, false)
        const coordinates = newGeo.geometry.coordinates
        let newDataInfo = {}
        if (dataInfo) {
          newDataInfo = dataInfo
        }
        newDataInfo.name = $('.pop-box .content-name').val()
        newDataInfo.importance = $(".pop-box input[name='importance']:checked").val()
        if (_this.geometryType == 'polygon') {
          const extent = _this.getExtent(newGeo.geometry)
          newDataInfo.coordinate = JSON.stringify(coordinates)
          newDataInfo.maxx = extent.maxx
          newDataInfo.minx = extent.minx
          newDataInfo.maxy = extent.maxy
          newDataInfo.miny = extent.miny
        } else {
          newDataInfo.coordinate = coordinates[0] + ',' + coordinates[1]
        }
        window.executeSystemFun(_this.systemIframe, _this.systemCallback, newDataInfo)
        layer.closePopup()
      })
      $('#btnCancel').off('click').on('click', function () {
        layer.closePopup()
        _this.deactiveToolbar()
        window.executeSystemFun(_this.systemIframe, _this.systemCallback, null)
      })
    }
  }

  /**
  * 获取geometry的extent
  * @param geometry  geometry
  */
  getExtent (geometry) {
    const data = geometry.coordinates
    var extent = { maxx: 0, minx: 0, maxy: 0, miny: 0 }
    for (let i = 0; i < data.length; i++) {
      const list = data[i]
      for (let j = 0; j < list.length; j++) {
        if (i == 0 && j == 0) {
          extent.maxx = list[j][0]
          extent.minx = list[j][0]
          extent.maxy = list[j][1]
          extent.miny = list[j][1]
        } else {
          extent.maxx = extent.maxx > list[j][0] ? extent.maxx : list[j][0]
          extent.minx = extent.minx < list[j][0] ? extent.minx : list[j][0]
          extent.maxy = extent.maxy > list[j][1] ? extent.maxy : list[j][1]
          extent.miny = extent.miny < list[j][1] ? extent.miny : list[j][1]
        }
      }
    }
    return extent
  }

  /**
   * 选取地图位置返回地址信息
   * @param geometryType  几何类型(点："makerPoint")
   * @param systemCallback  业务系统中的回调函数
   * @param systemIframe  业务系统中的需要通信的iframe
  */
  /**
  * 点击Geometry
  * @param layerId 需要点击的Geometry所在图层的图层id
  * @param systemCallback  业务系统中的回调函数
  * @param systemIframe  业务系统中的需要通信的iframe
  * @param once 是否只能单次点击
  */
  clickLayer (layerId, systemCallback, systemIframe, once) {
    const _this = this
    _this.systemCallback = systemCallback
    _this.systemIframe = systemIframe
    if (once) {
      _this.vectorLayer.off('click')// 关闭点击
    }
    _this.vectorLayer.on('click', function (e) {
      if (e.layer.feature.layerId == layerId) {
        const dataInfo = e.layer.feature.properties
        if (once) {
          _this.vectorLayer.off('click')// 关闭点击
        }
        window.executeSystemFun(_this.systemIframe, _this.systemCallback, dataInfo)
      }
    })
  }

  selecteLocation (geometryType, systemCallback, systemIframe) {
    const _this = this
    _this.systemCallback = systemCallback
    _this.systemIframe = systemIframe
    _this.changeMouse()
    _this.toolbar.deactivated()
    _this.editableLayers.clearLayers()
    _this.toolbar.activate(geometryType, function (layer, point) {
      layer.addTo(_this.editableLayers)
      _this.deactiveToolbar()
      const newGeo = transForm.normal(layer, false)
      const result = {
        X: newGeo.geometry.coordinates[0],
        Y: newGeo.geometry.coordinates[1]
      }
      _this.getAdress(point[1], point[0]).then(function (thisAddress) {
        result.thisAddress = thisAddress
        window.executeSystemFun(_this.systemIframe, _this.systemCallback, result)
      }).catch(function (e) {
        result.thisAddress = ''
        window.executeSystemFun(_this.systemIframe, _this.systemCallback, result)
      })
    })
  }

  /**
  * 获取百度地图api中文地址
  * @param lng  经度
  * @param lat  纬度
  */
  getAdress (lng, lat) {
    return new Promise(function (resolve, reject) { // 做一些异步操作
      // 经纬度转改gcj02
      var gcj02Coor = transformation.wgs84Togcj02(lng, lat)
      // gcj02转百度
      var bdCoor = transformation.gcj02Tobd09(gcj02Coor[0], gcj02Coor[1])
      // 获取百度地图地址
      transformation.getBaiduMapInfo(bdCoor[1], bdCoor[0]).then(function (backaddress) {
        resolve(backaddress)
      }).catch(function (res) {
        reject('获取地址失败，请填写地址')
      })
    })
  }

  /**
  * 获取服务查询结果
  * @param layer 几何对象
  */
  getQueryResult (layer) {
    const _this = this
    const asset = _this.queryLayer
    _this.deactiveToolbar()
    const geometry = transForm.normal(layer, false)
    const param = new SuperMap.QueryByGeometryParameters({
      queryParams: { name: asset + '@DataSource' },
      geometry
    })
    const service = L.supermap.queryService(this.topicManager.services[asset].url)
    service.queryByGeometry(param, (res) => {
      const result = res.result
      let resData = []// 查询结果
      if (result && result.recordsets) {
        resData = result.recordsets[0].features.features
      }
      window.executeSystemFun(_this.systemIframe, _this.systemCallback, resData)
    })
  }

  /**
  * 轨迹回放
  * @param patrolId 轨迹id
  */
  startPlayTrajectory (patrolId) {
    this.geoInfoLayer.clearLayers()
    const trajectoryInfo = this.getTrajectoryInfo(patrolId)// 获取轨迹坐标数据
    if (trajectoryInfo.length > 0) {
      const coordinates = trajectoryInfo
      // let coordinates = [[11848781.649254246,4638038.275253582],[11850921.886044143,4647516.466766868],[11837774.717172831,4653631.42902988],[11824933.296422314,4647516.46676686]];
      const geoJsonObj = this.getGeoJsonObject('LineString', coordinates)
      const line = transForm.normal(new L.geoJSON(geoJsonObj), true)
      const dataArry = line.features[0].geometry.coordinates// 转换后的坐标格式为[lng,lat]
      const latlngs = []
      for (let i = 0; i < dataArry.length; i++) {
        latlngs.push([dataArry[i][1], dataArry[i][0]])// 调整坐标格式为[lat,lng]
      }
      // let latlngs = [[38.42072592221866, 105.93953861120923],[38.373100307876356, 105.96563114050642],[38.35291050061322, 105.92923892859193],[38.397320642480274, 105.91413272741983]]
      this.map.fitBounds(new L.geoJSON(line).getBounds(), { padding: L.point(30, 30) })
      const polyline = L.polyline(latlngs, { color: 'red' }).addTo(this.geoInfoLayer)// 运动的轨迹
      const startPoint = latlngs[0]// 起点[38.42072592221866, 105.93953861120923]
      debugger
      // 轨迹运动的图标
      const move = L.marker(startPoint, {
        icon: L.icon({
          iconUrl: mapIcon.v_yellow,
          iconSize: [1, 1]
        })
      }).addTo(this.geoInfoLayer)

      // 添加一条线段也记录已经路过的点
      const passed = L.polyline([[]], { color: 'yellow' }).addTo(this.geoInfoLayer)
      move.on('update_position', function (e) {
        // 每次坐标更新。然后也更新路径
        passed.setLatLngs(e.path)
      })
      // 开始运动
      move.moveAlong(polyline, 1000)
    } else {
      this.showMessage('未获取到轨迹信息')
    }
  }

  /**
  * 获取历史轨迹坐标
  * @param id 轨迹id
  */
  getTrajectoryInfo (id) {
    let dataInfo = null
    $.ajax({
      type: 'POST',
      url: window.instanceMap.PRO_URL + 'app/getPointsByPatrolId.htm',
      data: { patrol_id: id },
      async: false,
      error: function (e) {},
      success: function (data) {
        var obj = JSON.parse(data)
        if (obj.code == 0) {
          dataInfo = obj.data
        }
      }
    })
    return dataInfo
  }

  /**
  * 消息提示
  * @param content 消息内容
  */
  showMessage (content) {
    var msg = content || '未获取到数据信息'
    layui.use('layer', () => {
      const layer = layui.layer
      layer.msg(msg)
    })
  }

  // 热力图
  addHeatMapLayer (data) {
    this.clearHeatMapLayer()
    // 热力图
    this.heatMapLayer = L.supermap.heatMapLayer('heatMap', {
      id: 'heatmap',
      map: this.map,
      radius: 20
    })
    const geoJsonObj = {
      type: 'FeatureCollection',
      features: []
    }
    for (let i = 0; i < data.length; i++) {
      const coordinate = data[i].coordinate.split(',')
      const feature = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Point',
          coordinates: coordinate
        }
      }
      geoJsonObj.features.push(feature)
    }

    const newGeojson = transForm.normal(new L.geoJSON(geoJsonObj), true)
    this.heatMapLayer.addFeatures(newGeojson)
    this.heatMapLayer.addTo(this.map)
  }

  // 删除热力图
  clearHeatMapLayer () {
    if (this.heatMapLayer) {
      this.map.removeLayer(this.heatMapLayer)
    }
  }

  /**
  * 运行监测
  * @param coordinate  坐标
  * @param pointIcon 图标 mapIcon对象的key
  * @param layerId 图层id
  * @param attributes 属性信息
  * @param size 图标大小 [18,26]
  */
  addOperationOverview (coordinate, pointIcon, layerId, attributes) {
    const customLayerId = layerId || 'operationMonitorLayer'
    const operationMonitorLayer = new L.geoJSON()
    operationMonitorLayer.layerId = customLayerId
    operationMonitorLayer.addTo(this.vectorLayer)
    const markerIcon = pointIcon ? mapIcon[pointIcon] : 'images/marker_red.png'
    const geoJsonObj = this.getGeoJsonObject('Point', coordinate, customLayerId, attributes)
    const point = transForm.normal(new L.geoJSON(geoJsonObj), true)
    operationMonitorLayer.addData(point)
    operationMonitorLayer.eachLayer((layer) => {
      const properties = layer.feature.properties
      layer.setIcon(
        L.icon({
          iconUrl: markerIcon,
          iconSize: [16, 16], // 设置icon大小
          iconAnchor: [8, 8] // 图标偏移
        })
      )
      let value = ''
      if (properties.hasOwnProperty('pressure') && properties.hasOwnProperty('flow')) { // 综合监测点
        value = 'P: ' + properties.pressure + ' (' + properties.pre_unit + ') ' + ', F: ' + properties.flow + ' (' + properties.flow_unit + ') '
      } else if (properties.hasOwnProperty('pressure')) { // 压力监测点
        value = 'P : ' + properties.pressure + '(' + properties.pre_unit + ')'
      } else if (properties.hasOwnProperty('flow')) { // 流量监测点
        value = 'F : ' + properties.flow + '(' + properties.flow_unit + ')'
      } else {
        value = '-'// 内容
      }
      const content = properties.community + '： ' + value
      layer.bindTooltip(content)
      layer.bindPopup(content, {
        keepInView: false,
        autoClose: false,
        closeOnClick: false,
        className: 'popup-style'
      })
    })
  }

  /**
  * 关阀分析点和弹框
  * @param coordinate  坐标
  * @param pointIcon 图标 mapIcon对象的key
  * @param layerId 图层id
  * @param attributes 属性信息
  * @param labelText 标注内容
  */
  addCloseValveView (coordinate, pointIcon, layerId, attributes, labelText) {
    const _this = this
    const customLayerId = layerId || 'closeValveLayer'
    const closeValveLayer = new L.geoJSON()
    closeValveLayer.layerId = customLayerId
    closeValveLayer.addTo(this.vectorLayer)
    const markerIcon = pointIcon ? mapIcon[pointIcon] : 'images/marker_red.png'
    const geoJsonObj = this.getGeoJsonObject('Point', coordinate, customLayerId, attributes)
    const point = transForm.normal(new L.geoJSON(geoJsonObj), true)
    closeValveLayer.addData(point)
    closeValveLayer.eachLayer((layer) => {
      const properties = layer.feature.properties
      layer.setIcon(
        L.icon({
          iconUrl: markerIcon,
          iconSize: [16, 16], // 设置icon大小
          iconAnchor: [8, 8] // 图标偏移
        })
      )
      if (attributes) {
        const direction = _this.transCodeByName(properties.direction)
        const material = _this.transCodeByName(properties.material)
        const content = `<div>编号：${properties.p_code}</div>
                     <div>口径：${Number(properties.caliber)}</div>
                     <div>方向：${direction}</div>
                     <div>材质：${material}</div>`
        layer.bindPopup(content, {
          keepInView: false,
          autoClose: false,
          closeOnClick: false,
          className: 'closevalve-popup'
        }).openPopup()
      }
    })
    if (labelText) {
      const marker = L.divIcon({
        html: '<span style="color:#fff">' + labelText + '</span>', // marker标注
        className: 'my-div-icon',
        iconSize: [16, 16],
        iconAnchor: [8, 8] // 文字标注相对位置
      })
      const [lat, lng] = transForm.PointArr(coordinate, true)
      L.marker([lat, lng], { icon: marker }).addTo(closeValveLayer)
    }
  }

  /**
       * 获取多边行的质心
       * @param coordinates 坐标
       * @param type 多边形类型(Polygon/MultiPolygon)
    */
  getCenterOfMass (coordinates, type) {
    const geoJsonObj = this.getGeoJsonObject(type, coordinates)
    const polygon = transForm.normal(new L.geoJSON(geoJsonObj), true)
    var center = turf.centerOfMass(polygon)
    return center
  }

  // 获取code数据
  getNameByCode () {
    let dataInfo = {}
    $.ajax({
      type: 'POST',
      url: window.instanceMap.PRO_URL + 'querySubLevelDictMap.htm',
      data: {},
      async: false,
      error: function (e) {},
      success: function (data) {
        var obj = JSON.parse(data)
        if (obj.code == 0) {
          dataInfo = obj.data
          sessionStorage.setItem('dictionaryMap', JSON.stringify(dataInfo))
        }
      }
    })
    return dataInfo
  };

  // 获取code对应的中文
  transCodeByName (code) {
    if (!isNaN(Number(code)) && Number(code) < 200201) {
      return code
    }
    let dictionaryMap = sessionStorage.getItem('dictionaryMap')
    if (dictionaryMap == null) {
      dictionaryMap = this.getNameByCode()
    } else {
      dictionaryMap = JSON.parse(dictionaryMap)
    }
    const nameByCode = dictionaryMap[code] == undefined ? code : dictionaryMap[code]
    return nameByCode
  }

  // 底图最大级别(未限制底图缩放，其他资产需要无限放大)
  getBaseMaxZoom () {
    var maxZoom = window.config.mapOption.maxZoom ? window.config.mapOption.maxZoom : 11
    return maxZoom
  }
}

export default Operation
