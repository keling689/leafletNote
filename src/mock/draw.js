/* eslint-disable */
import intersect from '@turf/intersect'
import booleanContains from '@turf/boolean-contains'
import {
  polygon
} from '@turf/helpers'
// 创建一个Draw构造函数来管理绘制的图形
function Draw (map) {
  this.map = map
  this.lines = new L.polyline([])
  this.tempLines = new L.polyline([])
  this.tempPolygon = new L.polygon([])
  this.tempRectangle = undefined
}
// 激活绘制工具
Draw.prototype.activate = function (type, callback, param) {
  console.log('激活')
  switch (type) {
    case 'point':
      this.drawPoint(callback)
      break
    case 'polyline':
      this.drawPolyline(callback)
      break
    case 'polygon':
      this.drawPolygon(callback)
      break
    case 'rectangle':
      this.drawRectangle(callback)
      break
    case 'angle':
      this.drawAngle(callback)
      break
    case 'makerPoint':
      this.drawMarkerPoint(callback, param)
      break
    case 'circle':
      this.drawCircle(callback, param)
      break
    default:
      break
  }
}
// 清除监听事件并终止绘制
Draw.prototype.deactivated = function () {
  this.map.off('click dblclick mousemove')
  this.lines.setLatLngs([])
  this.tempLines.setLatLngs([])
  this.tempPolygon.setLatLngs([])
  if (typeof this.tempRectangle === 'undefined') {
    this.tempRectangle = undefined
  } else {
    this.tempRectangle.remove()
  }
}
// 绘制点
Draw.prototype.drawPoint = function (callback) {
  this.map.on('click', function (e) {
    const point = L.circle(e.latlng, {
      radius: 0.1,
      color: '#38f',
      fillColor: '#38f',
      fillOpacity: 1
    })
    callback(point, e)
  })
}
// 绘制marker点
Draw.prototype.drawMarkerPoint = function (callback, iconUrl) {
  this.map.on('click', function (e) {
    let icon = 'images/marker_red.png'
    if (iconUrl) {
      icon = iconUrl
    }
    const markerIcon = L.icon({
      iconUrl: icon,
      iconSize: [18, 26], // 设置icon大小
      iconAnchor: [9, 26], // 图标偏移
      popupAnchor: [-9, -40] // 弹框偏移
    })
    const point = L.marker(e.latlng, { icon: markerIcon })
    callback(point, [e.latlng.lat, e.latlng.lng])
  })
}
// 绘制圆
Draw.prototype.drawCircle = function (callback, param) {
  this.map.on('click', function (e) {
    // 圆
    const point = L.circle(e.latlng, {
      radius: param,
      color: '#73EB07',
      fillColor: '#000',
      fillOpacity: 0.2
    })
    // 圆心
    const centerPoint = L.circle(e.latlng, {
      radius: 0.1,
      color: '#38f',
      fillColor: '#38f',
      fillOpacity: 1
    })
    callback(point, centerPoint, e)
  })
}
// 绘制线
Draw.prototype.drawPolyline = function (callback) {
  const _this = this
  var points = []
  // var lines = new L.polyline(points);
  // var tempLines = new L.polyline([]);
  this.map.on('click', onClick) // 点击地图
  function onClick (e) {
    // 添加点
    const len = points.length
    if (len === 0) {
      points.push([e.latlng.lat, e.latlng.lng])
      // console.log(points);
    } else {
      if (points[len - 1][0] !== e.latlng.lat || points[len - 1][1] !== e.latlng.lng) {
        points.push([e.latlng.lat, e.latlng.lng])
      }
    }
    _this.lines.setLatLngs(points)
    _this.map.addLayer(_this.lines)
    // editableLayers.addLayer(L.circle(e.latlng, { color: '#ff0000', fillColor: 'ff0000', fillOpacity: 1 }))
    _this.map.on('mousemove', onMove) // 移动鼠标
  }

  function onMove (e) {
    // 添加线
    if (points.length > 0) {
      const ls = [points[points.length - 1],
        [e.latlng.lat, e.latlng.lng]
      ]
      _this.tempLines.setLatLngs(ls)
      _this.map.addLayer(_this.tempLines)
    }
    _this.map.on('dblclick', onDoubleClick)
  }

  function onDoubleClick (e) {
    // points.pop();//清除单击事件的影响
    callback(L.polyline(points), points)
    points = []
    _this.lines.setLatLngs([])
    _this.tempLines.setLatLngs([])
    _this.map.off('mousemove', onMove)
  }
}
// 绘制多边形
Draw.prototype.drawPolygon = function (callback) {
  const _this = this
  var points = []
  var count = 0 // 当前多边形的点数
  this.map.on('click', onClick)

  function onClick (e) {
    // 添加点
    if (count === 0) {
      points.push([e.latlng.lat, e.latlng.lng])
      // console.log(points);
      count = count + 1
    } else {
      if (points[count - 1][0] !== e.latlng.lat || points[count - 1][1] !== e.latlng.lng) {
        if (count < 3) {
          points.push([e.latlng.lat, e.latlng.lng])
          count = count + 1
        } else {
          if (judgeIntersection(points, e)) {
            points.push([e.latlng.lat, e.latlng.lng])
            count = count + 1
          }
        }
      }
    }
    // ifClickAndMove = false;
    _this.map.on('mousemove', onMove)
    // editableLayers.addLayer(L.circle(e.latlng, { color: '#ff0000', fillColor: 'ff0000', fillOpacity: 1 }))
  }

  function onMove (e) {
    // 添加线
    if (points.length === 1) {
      const ls = [points[points.length - 1],
        [e.latlng.lat, e.latlng.lng]
      ]
      _this.tempPolygon.setLatLngs(ls)
      _this.map.addLayer(_this.tempPolygon)
    } else {
      const temps = points.slice(0)
      temps[count] = [e.latlng.lat, e.latlng.lng]
      _this.tempPolygon.setLatLngs([temps])
      _this.map.on('dblclick', onDoubleClick)
    }
  }

  function onDoubleClick (e) {
    // 渲染多边形
    callback(L.polygon([points]), points)
    points = []
    count = 0
    _this.tempPolygon.setLatLngs([])
    _this.map.off('mousemove', onMove)
    _this.map.off('dblclick', onDoubleClick) // 双击地图
  }

  function judgeIntersection (points, e) {
    // console.log(points);
    let lats = points.slice(0)
    lats = lats.map(function (value) {
      const [x, y] = value
      return [y, x]
    })
    // console.log(lats);
    lats.push(lats[0])
    const poly1 = polygon([lats])
    const poly2 = polygon([
      [lats[0], lats[lats.length - 2],
        [e.latlng.lng, e.latlng.lat], lats[0]
      ]
    ])
    const intersection = intersect(poly1, poly2)
    const contains = booleanContains(poly1, poly2)
    console.log(intersection)
    console.log(contains)
    if (intersection === null || intersection.geometry.type === 'LineString' || contains) {
      console.log('不相交')
      return true
    } else {
      console.log('相交')
      return false
    }
  }
}
// 绘制矩形
Draw.prototype.drawRectangle = function (callback) {
  const _this = this
  let latlngs = []
  this.map.on('click', onclick) // 点击地图

  function onclick (e) {
    console.log('矩形单击')
    // 左上角坐标
    latlngs = [
      [e.latlng.lat, e.latlng.lng],
      [e.latlng.lat, e.latlng.lng]
    ]
    _this.tempRectangle = new L.rectangle(latlngs).addTo(_this.map)
    // 开始绘制，监听鼠标移动事件
    _this.map.on('mousemove', onMove)
    _this.map.off('click', onclick)
  }
  function onMove (e) {
    // 多余的判断，没有生效
    latlngs[1] = [e.latlng.lat, e.latlng.lng]
    _this.tempRectangle.setBounds(L.latLngBounds(latlngs))
    _this.map.on('dblclick', dbClick)
  }

  function dbClick (e) {
    // 渲染矩形
    console.log('矩形双击')
    if (latlngs.length > 0) {
      callback(L.rectangle(latlngs), latlngs)
      latlngs = []
      _this.tempRectangle.remove()
      // _this.map.on('click', onclick);
      _this.map.off('mousemove', onMove)
    }
  }
}
// 绘制夹角
Draw.prototype.drawAngle = function (callback) {
  const _this = this
  var points = []
  // var lines = new L.polyline(points);
  // var tempLines = new L.polyline([]);
  this.map.on('click', onClick) // 点击地图
  function onClick (e) {
    // 添加点
    const len = points.length
    if (points.length < 3) {
      if (len === 0) {
        points.push([e.latlng.lat, e.latlng.lng])
        // console.log(points);
      } else {
        if (points[len - 1][0] !== e.latlng.lat || points[len - 1][1] !== e.latlng.lng) {
          points.push([e.latlng.lat, e.latlng.lng])
        }
      }
      _this.lines.setLatLngs(points)
      _this.map.addLayer(_this.lines)
      // editableLayers.addLayer(L.circle(e.latlng, { color: '#ff0000', fillColor: 'ff0000', fillOpacity: 1 }))
      _this.map.on('mousemove', onMove) // 移动鼠标
    }
  }

  function onMove (e) {
    // 添加线
    if (points.length > 0) {
      const ls = [points[points.length - 1],
        [e.latlng.lat, e.latlng.lng]
      ]
      _this.tempLines.setLatLngs(ls)
      _this.map.addLayer(_this.tempLines)
    }
    if (points.length === 3) {
      callback(L.polyline(points), points)
      _this.tempLines.setLatLngs([])
      _this.lines.setLatLngs([]) // 清空线图层
      points = []
      map.off('mousemove', onMove)
    }
  }
}
export default Draw
