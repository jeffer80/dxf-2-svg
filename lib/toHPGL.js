const BoundingBox = require('./BoundingBox')
const denormalise = require('./denormalise').denormalise
const entityToPolyline = require('./entityToPolyline').entityToPolyline

function polylineToPath(polyline, origin) {
  return polyline.reduce(function (acc, point, i) {
    acc += i === 0 ? 'PU' : 'PD'
    acc += Math.round((point[1] - origin[1]) * 40) + ',' + Math.round((point[0] - origin[0]) * 40) + ' '
    return acc
  }, '')
}

/**
 * Convert the interpolate polylines to HPGL
 */
export const toHPGL = parsed => {
  const entities = denormalise(parsed)
  const polylines = entities.map(e => {
    return entityToPolyline(e)
  })
  const bbox = new BoundingBox.BoundingBox()

  polylines.forEach(polyline => {
    polyline.forEach(point => {
      bbox.expandByPoint(point[0], point[1])
    })
  })

  var origin = [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER]
  polylines.forEach(polyline => {
    polyline.forEach(point => {
      origin[0] = Math.min(origin[0], point[0])
      origin[1] = Math.min(origin[1], bbox.maxY - point[1])
    })
  })
  if (origin[0] === Number.MAX_SAFE_INTEGER) {
    origin[0] = 0
  }
  if (origin[1] === Number.MAX_SAFE_INTEGER) {
    origin[1] = 0
  }

  const paths = []
  polylines.forEach((polyline, i) => {
    const entity = entities[i]
    const layerTable = parsed.tables.layers[entity.layer]
    if (!layerTable) {
      throw new Error('no layer table for layer:' + entity.layer)
    }

    const p2 = polyline.map(function (p) {
      return [p[0], bbox.maxY - p[1]]
    })
    paths.push(polylineToPath(p2, origin))
  })

  let pltString = 'IN IN '
  paths.map(item => {
    if (item !== undefined && item !== '') {
      pltString += item
    }
  })
  pltString += '@ '
  return pltString
}
