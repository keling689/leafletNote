export const formArr =
{
  // 阀门
  valves: [
    {
      type: 'seletBox',
      tittle: '结构',
      key: 'mainValveType',
      dict: 'wSystemValveSubtype',
      columns: [
        { name: '蝶阀', val: 'Butterfly' },
        { name: '球阀', val: 'Ball' },
        { name: '锥形阀', val: 'Cone' },
        { name: '闸阀', val: 'Gate' },
        { name: '旋塞阀', val: 'Plug' },
        { name: '碟阀', val: 'Disc' }
      ]
    },
    {
      type: 'seletBox',
      tittle: '功能',
      key: 'controlValve',
      dict: 'wControlValveSubtype',
      columns: [
        { name: '减压阀', val: 'PressureReduce' },
        { name: '单向止逆阀', val: 'CheckValve' },
        { name: '排气阀', val: 'AirRelease' },
        { name: '稳压阀', val: 'PressureSustained' },
        { name: '排泥阀', val: 'BlowOff' },
        { name: '真空阀', val: 'Vacuum' }
      ]
    },
    {
      type: 'seletRange',
      tittle: '口径',
      key: 'diameter',
      label: 'front'
    },
    {
      type: 'timeRange',
      tittle: '敷设年代',
      key: 'inputDate'
    }
  ],
  // 消防栓
  hydrants: [
    {
      type: 'seletBox',
      tittle: '类型',
      key: 'hydrantType',
      dict: 'wHydrantType',
      columns: [
        { name: '地面式消防栓', val: 'GroundHydrant' },
        { name: '地下消防栓', val: 'UndergroundHydrant' },
        { name: '未知', val: 'Unknown' }
      ]
    },
    {
      type: 'seletRange',
      tittle: '口径',
      key: 'diameter',
      label: 'front'
    },

    {
      type: 'seletBox',
      tittle: '是否有护栏',
      key: 'subtype',
      columns: [
        {
          name: '是',
          val: 1
        }, {
          name: '否',
          val: 0
        }
      ]
    }
  ],

  // 检查井
  manholes: [
    {
      type: 'seletBox',
      tittle: '入口类型',
      key: 'accesType',
      columns: [
        { name: '门', val: 'Door' },
        { name: '格棚', val: 'Grate' },
        { name: '手孔', val: 'Hand' },
        { name: '盖子', val: 'Lid' },
        { name: '井盖', val: 'ManholeCover' },
        { name: '其他', val: 'Other' },
        { name: '未知', val: 'Unknown' }
      ]
    }
  ],
  // 计控仪表
  meters: [
    {
      type: 'seletBox',
      tittle: '计控仪表',
      key: 'type',
      dict: 'wMeasureEquipmentSubtype',
      columns: [
        { name: '流量计', val: 'FlowMeter' },
        { name: '压力仪', val: 'PressureGauge' },
        { name: '水质仪', val: 'WaterQualityMeter' }
      ]
    },
    {
      type: 'seletRange',
      tittle: '口径',
      key: 'diameter',
      label: 'front'
    }
  ],

  // 管线
  pipes: [
    {
      type: 'seletRange',
      tittle: '口径',
      key: 'diameter',
      label: 'front'
    },
    {
      type: 'seletRange',
      tittle: '深埋',
      key: 'depth',
      label: 'end'
    },
    {
      type: 'seletRange',
      tittle: '管长',
      key: 'length',
      label: 'end'
    },
    {
      type: 'timeRange',
      tittle: '敷设年代',
      key: 'inputDate'
    },
    {
      type: 'seletBox',
      tittle: '敷设方式',
      key: 'laying',
      dict: 'wLayingType',
      columns: [
        {
          name: '埋设',
          val: 'Burying'
        }, {
          name: '地面',
          val: 'Ground '
        },
        {
          name: '架高',
          val: 'Elevate '
        }
      ]
    }
  ],

  // 水泵
  pumps: [
    {
      type: 'seletBox',
      tittle: '类型',
      key: 'type',
      dict: 'wPumpSubtype',
      columns: [
        { name: '加压泵', val: 'Booster' },
        { name: '抽水泵', val: 'WaterPump' }
      ]
    }
  ],
  // 管道连接件
  junctions: [
    {
      type: 'seletBox',
      tittle: '类型',
      key: 'type',
      dict: 'wJunctionSubtype',
      columns: [
        { name: '弯管', val: 'Bend' },
        { name: '堵头', val: 'EndCap' },
        { name: '四通', val: 'Cross' },
        { name: '接头', val: 'Coupling' },
        { name: '伸缩接头', val: 'ExpansionJoint' },
        { name: '短管', val: 'Offset' },
        { name: '变径', val: 'Reducer' },
        { name: '变材', val: 'Meterial' },
        { name: '立管', val: 'Riser' },
        { name: '鞍形支架', val: 'Saddle' },
        { name: '套筒', val: 'Sleeve' },
        { name: '水龙头', val: 'Tap' },
        { name: '三通', val: 'Tee' },
        { name: '焊接头', val: 'Weld' },
        { name: 'Y字管', val: 'Wye' }
      ]
    }
  ],

  // 管网构造
  structures: [
    {
      type: 'seletBox',
      tittle: '结构',
      key: 'subtype',
      columns: [
        { name: '水厂二泵房', val: 'PlantPumpStation' },
        { name: '增压泵房', val: 'BoosterStation' },
        { name: '水箱', val: 'Tank' },
        { name: '蓄水池', val: 'Reservoir' },
        { name: '生产井', val: 'ProductionWell' },
        { name: '封闭储水设施', val: 'EnclosedStorageFacility' },
        { name: '小区加压泵房', val: 'ResidentialBooster' }
      ]
    }
  ]
}
