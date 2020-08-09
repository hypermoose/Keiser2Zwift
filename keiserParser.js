global.atob = require("atob");

const encodeStringToBytes = (rawString) => {
    let data = atob(rawString)
    let bytes = new Uint8Array(data.length)
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = data.charCodeAt(i)
    }
    return bytes
  }
  
  const getAdvertisingData = (response) => {
    let advertisingData;
    if (typeof response.advertisement !== 'string') {
      let advertisement = encodeStringToBytes(response.advertisement.manufacturerData)
      advertisingData = [].slice.call(advertisement, 2)
    } else {
      let advertisement = encodeStringToBytes(response.advertisement)
      if (advertisement.length > 17) {
        advertisingData = [].slice.call(advertisement, 11)
      } else {
        advertisingData = Array.from(advertisement)
      }
    }
    return advertisingData
  }
  
  const buildValueConvert = (value) => {
    return parseInt(value.toString(16), 10)
  }
  
  const twoByteConcat = (lower, higher) => {
    return (higher << 8) | lower
  }
 
 var parseAdvertisement = function(response) {
    let data = getAdvertisingData(response)
    let broadcast = {
      takenAt: (new Date()).getTime(),
      ordinalId: 0,
      buildMajor: 0,
      buildMinor: 0,
      interval: 0,
      realTime: false,
      cadence: 0,
      heartRate: 0,
      power: 0,
      caloricBurn: 0,
      duration: 0,
      gear: null,
      distance: 0
    }
  
    let index = 0
  
    broadcast.buildMajor = buildValueConvert(data[index++])
    if (broadcast.buildMajor !== 6) {
      throw new Error('Invalid build major')
    }
    broadcast.buildMinor = buildValueConvert(data[index++])
  
    if (broadcast.buildMajor === 6 && data.length > (index + 13)) {
      let dataType = data[index]
      if (dataType === 0 || dataType === 255) {
        broadcast.interval = 0
      } else if (dataType > 128 && dataType < 255) {
        broadcast.interval = dataType - 128
      }
      broadcast.realTime = dataType === 0 || (dataType > 128 && dataType < 255)
  
      broadcast.ordinalId = data[index + 1]
      if (broadcast.ordinalId <= 0 || broadcast.ordinalId > 200) {
        throw new Error('Invalid machine id')
      }
  
      broadcast.cadence = Math.round(twoByteConcat(data[index + 2], data[index + 3]) / 10)
      broadcast.heartRate = Math.round(twoByteConcat(data[index + 4], data[index + 5]) / 10) || null
      broadcast.power = twoByteConcat(data[index + 6], data[index + 7])
      broadcast.caloricBurn = twoByteConcat(data[index + 8], data[index + 9])
      broadcast.duration = data[index + 10] * 60 + data[index + 11]
  
      broadcast.distance = twoByteConcat(data[index + 12], data[index + 13])
      if ((broadcast.distance & 32768) !== 0) {
        // Metric
        broadcast.distance = broadcast.distance / 10
      } else {
        // Imperial (to Metric)
        broadcast.distance = ((broadcast.distance & 32767) / 10) * 1.60934
      }
  
      if (broadcast.buildMinor >= 21 && data.length > (index + 14)) {
        broadcast.gear = data[index + 14]
      }
    }
  
    return broadcast
  }

  module.exports.parseAdvertisement = parseAdvertisement