/* eslint-disable no-undef */
// L.Util.transform(new L.circleMarker([y,x]), L.Proj.CRS("EPSG:4547"), L.CRS.EPSG4326);

class transForm {
  constructor (dataCor, mapCor = L.CRS.EPSG4326) {
    this.dataCor = dataCor
    this.mapCor = mapCor
  }

  // 一般接口
  normal (feature, toLatLng) {
    let geojson
    if (toLatLng) {
      geojson = L.Util.transform(feature, this.dataCor, this.mapCor)
    } else {
      geojson = L.Util.transform(feature, this.mapCor, this.dataCor)
    }
    return geojson
  }

  PointArr (coordinate, toLatLng) {
    const [x, y] = coordinate
    let geojson
    if (toLatLng) {
      geojson = L.Util.transform(L.marker([y, x]), this.dataCor, this.mapCor)
    } else {
      geojson = L.Util.transform(L.marker([y, x]), this.mapCor, this.dataCor)
    }
    // debugger
    return geojson.geometry.coordinates.reverse()
  }

  Polygon () {

  }

  line (lineArrays, toLatLng) {
    // debugger
    // let temp = lineArrays.slice(0);
    // let changedline = temp.map(item => item.reverse());
    const [x, y] = lineArrays
    const [a, b] = x
    const [c, d] = y
    const changedline = [[b, a], [d, c]]
    let geojson
    if (toLatLng) {
      geojson = L.Util.transform(L.polyline(changedline), this.dataCor, this.mapCor)
    } else {
      geojson = L.Util.transform(L.polyline(changedline), this.mapCor, this.dataCor)
    }
    const coordinates = geojson.geometry.coordinates.map(item => item.reverse())
    return coordinates
  }

  geoJson (geoLayer, toLatLng) {
    let returnGeoJson
    if (toLatLng) {
      geojson = L.Util.transform(geoLayer, this.dataCor, this.mapCor)
    } else {
      geojson = L.Util.transform(geoLayer, this.mapCor, this.dataCor)
    }
    return returnGeoJson
  }
}

transForm.Point = function () {

}

export default transForm
