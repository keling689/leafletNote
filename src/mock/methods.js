/* eslint-disable */
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import WKT from "terraformer-wkt-parser";
export default {
  methods: {
    /**
     * @description 加载区域数据
     */
    getAreaEquimentDatasSuccess(dataObj) {
      // 模拟
      let areaEquimentDatas = dataObj
      if(window.isCordova) {
        // 与安卓交互
        areaEquimentDatas = JSON.parse(dataObj)
      }
      // console.log('areaEquimentDatas', areaEquimentDatas)
      this.feaGroup = [];
      
      let typeArr = ["pipes", "junctions","valves","hydrants","manholes","subnetlines","meters"]
      
      for(const item of typeArr){
        let datas = areaEquimentDatas[item] || []
        for (let i = 0; i < datas.length; i++) {
          const fea = {
            features: [
              {
                type: "Feature",
                properties: {
                  feaType: item,
                  id: datas[i].id,
                  model: datas[i].model,
                  subtype: datas[i].subtype,
                  material: datas[i].material,
                  manufacturer: datas[i].manufacturer,
                  constructor: datas[i].constructor,
                  installDate: datas[i].installDate,
                  equimentType: datas[i].equimentType,
                  author: datas[i].author,
                  status: datas[i].status,
                  diameter: datas[i].diameter,
                  locationDescription: datas[i].locationDescription
                },
                geometry: WKT.parse(datas[i].geom.substring(10))
              }
            ]
          };
          this[item + 'Arr'].push(fea);
          this.feaGroup.push(fea);
        }
      }
     

      // const pipeDatas = areaEquimentDatas.pipes || []
      // for (let i = 0; i < pipeDatas.length; i++) {
      //   const fea = {
      //     features: [
      //       {
      //         type: "Feature",
      //         properties: {
      //           feaType: "pipes",
      //           id: pipeDatas[i].id,
      //           model: pipeDatas[i].model,
      //           subtype: pipeDatas[i].subtype,
      //           material: pipeDatas[i].material,
      //           manufacturer: pipeDatas[i].manufacturer,
      //           constructor: pipeDatas[i].constructor,
      //           installDate: pipeDatas[i].installDate,
      //           equimentType: pipeDatas[i].equimentType,
      //           author: pipeDatas[i].author,
      //           status: pipeDatas[i].status,
      //           diameter: pipeDatas[i].diameter,
      //           locationDescription: pipeDatas[i].locationDescription
      //         },
      //         geometry: WKT.parse(pipeDatas[i].geom.substring(10))
      //       }
      //     ]
      //   };
      //   // console.log(WKT.parse(pipeDatas[i].geom.substring(10)),pipeDatas[i].geom.substring(10),99999999)
      //   this.pipesArr.push(fea);
      //   this.feaGroup.push(fea);
      // }
      // // 管道连接件
      // const junctions = areaEquimentDatas.junctions || [];
      // for (let i = 0; i < junctions.length; i++) {
      //   const fea = {
      //     features: [
      //       {
      //         type: "Feature",
      //         properties: {
      //           feaType: "junctions",
      //           id: junctions[i].id,
      //           model: junctions[i].model,
      //           subtype: junctions[i].subtype,
      //           manufacturer: junctions[i].manufacturer,
      //           constructor: junctions[i].constructor,
      //           installDate: junctions[i].installDate,
      //           elevation: junctions[i].elevation,
      //           equimentType: junctions[i].equimentType,
      //           depth: junctions[i].depth,
      //           author: junctions[i].author,
      //           lifecycleStatus: junctions[i].lifecycleStatus,
      //           locationDescription: junctions[i].locationDescription
      //         },
      //         geometry: WKT.parse(junctions[i].geom.substring(10))
      //       }
      //     ]
      //   };
      //   this.junctionsArr.push(fea);
      //   this.feaGroup.push(fea);
      // }
      // // 控制阀
      // const controlValves = areaEquimentDatas.controlValves || [];
      // for (let i = 0; i < controlValves.length; i++) {
      //   const fea = {
      //     features: [
      //       {
      //         type: "Feature",
      //         properties: {
      //           feaType: "controlValves",
      //           id: controlValves[i].id,
      //           model: controlValves[i].model,
      //           subtype: controlValves[i].subtype,
      //           manufacturer: controlValves[i].manufacturer,
      //           equimentType: controlValves[i].equimentType,
      //           constructor: controlValves[i].constructor,
      //           installDate: controlValves[i].installDate,
      //           elevation: controlValves[i].elevation,
      //           depth: controlValves[i].depth,
      //           author: controlValves[i].author,
      //           lifecycleStatus: controlValves[i].lifecycleStatus,
      //           locationDescription: controlValves[i].locationDescription
      //         },
      //         geometry: WKT.parse(controlValves[i].geom.substring(10))
      //       }
      //     ]
      //   };
      //   this.controlValvesArr.push(fea);
      //   this.feaGroup.push(fea);
      // }
      // // 消防栓
      // const hydrants = areaEquimentDatas.hydrants || [];
      // for (let i = 0; i < hydrants.length; i++) {
      //   const fea = {
      //     features: [
      //       {
      //         type: "Feature",
      //         properties: {
      //           feaType: "hydrants",
      //           id: hydrants[i].id,
      //           model: hydrants[i].model,
      //           subtype: hydrants[i].subtype,
      //           manufacturer: hydrants[i].manufacturer,
      //           constructor: hydrants[i].constructor,
      //           equimentType: hydrants[i].equimentType,
      //           installDate: hydrants[i].installDate,
      //           elevation: hydrants[i].elevation,
      //           depth: hydrants[i].depth,
      //           author: hydrants[i].author,
      //           lifecycleStatus: hydrants[i].lifecycleStatus,
      //           locationDescription: hydrants[i].locationDescription
      //         },
      //         geometry: WKT.parse(hydrants[i].geom.substring(10))
      //       }
      //     ]
      //   };
      //   this.feaGroup.push(fea);
      //   this.hydrantsArr.push(fea);
      // }
      // // 管道井
      // const manholes = areaEquimentDatas.manholes || [];
      // console.log("areaEquimentDatas", areaEquimentDatas);
      // for (let i = 0; i < manholes.length; i++) {
      //   const fea = {
      //     features: [
      //       {
      //         type: "Feature",
      //         properties: {
      //           feaType: "manholes",
      //           id: manholes[i].id,
      //           model: manholes[i].model,
      //           subtype: manholes[i].subtype,
      //           manufacturer: manholes[i].manufacturer,
      //           constructor: manholes[i].constructor,
      //           installDate: manholes[i].installDate,
      //           equimentType: manholes[i].equimentType,
      //           elevation: manholes[i].elevation,
      //           depth: manholes[i].depth,
      //           author: manholes[i].author,
      //           lifecycleStatus: manholes[i].lifecycleStatus,
      //           locationDescription: manholes[i].locationDescription
      //         },
      //         geometry: WKT.parse(manholes[i].geom.substring(10))
      //       }
      //     ]
      //   };
      //   this.manholesArr.push(fea);
      //   this.feaGroup.push(fea);
      // }
      // // 系统阀
      // const systemValves = areaEquimentDatas.systemValves || [];
      // for (let i = 0; i < systemValves.length; i++) {
      //   const fea = {
      //     features: [
      //       {
      //         type: "Feature",
      //         properties: {
      //           feaType: "systemValves",
      //           id: systemValves[i].id,
      //           model: systemValves[i].model,
      //           subtype: systemValves[i].subtype,
      //           manufacturer: systemValves[i].manufacturer,
      //           constructor: systemValves[i].constructor,
      //           equimentType: systemValves[i].equimentType,
      //           installDate: systemValves[i].installDate,
      //           elevation: systemValves[i].elevation,
      //           depth: systemValves[i].depth,
      //           author: systemValves[i].author,
      //           lifecycleStatus: systemValves[i].lifecycleStatus,
      //           locationDescription: systemValves[i].locationDescription
      //         },
      //         geometry: WKT.parse(systemValves[i].geom.substring(10))
      //       }
      //     ]
      //   };
      //   this.systemValvesArr.push(fea);
      //   this.feaGroup.push(fea);
      // }
      // // 计控仪表
      // const meters = areaEquimentDatas.meters || [];
      // for (let i = 0; i < meters.length; i++) {
      //   const fea = {
      //     features: [
      //       {
      //         type: "Feature",
      //         properties: {
      //           feaType: "meters",
      //           id: meters[i].id,
      //           model: meters[i].model,
      //           subtype: meters[i].subtype,
      //           manufacturer: meters[i].manufacturer,
      //           constructor: meters[i].constructor,
      //           installDate: meters[i].installDate,
      //           equimentType: meters[i].equimentType,
      //           elevation: meters[i].elevation,
      //           depth: meters[i].depth,
      //           author: meters[i].author,
      //           lifecycleStatus: meters[i].lifecycleStatus,
      //           locationDescription: meters[i].locationDescription
      //         },
      //         geometry: WKT.parse(meters[i].geom.substring(10))
      //       }
      //     ]
      //   };
      //   this.metersArr.push(fea);
      //   this.feaGroup.push(fea);
      // }

      this.selectDatasLayer = {
        管线: this.pipesArr,
        管道连接件: this.junctionsArr,
        阀门: this.valvesArr,
        消防栓: this.hydrantsArr,
        管道井: this.manholesArr,
        功能管线: this.subnetlinesArr,
        计控仪表: this.metersArr
      };

      this.allFeaLayer = L.geoJson(this.feaGroup, {
        pmIgnore: false,
        style: {
          color: "red",
          fillColor: "#f03",
          weight: 1,
          fillOpacity: 0.1
        },
        markersInheritOptions: true,
        pointToLayer: (feature, latlng) => {
          return L.marker(latlng, {
            icon: this.swicthCreateIcon(feature.properties.feaType)
          });
        }
      });
      // console.log('this.allFeaLayer ', this.allFeaLayer)
      this.map.addLayer(this.allFeaLayer);
    }
  }
}
