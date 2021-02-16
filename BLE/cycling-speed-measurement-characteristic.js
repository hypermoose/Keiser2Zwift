
var Bleno = require('@abandonware/bleno');
var now = require("performance-now");
var DEBUG = true;

class CyclingSpeedMeasurementCharacteristic extends  Bleno.Characteristic {
 
  constructor() {
    super({
      uuid: '2A5B',
      value: null,
      properties: ['notify'],
      descriptors: []
    });
    this._updateValueCallback = null;  
    this._cumulativeRevs = -1;
    this._lastNotify = now();
  }

  onSubscribe(maxValueSize, updateValueCallback) {
    if (DEBUG) console.log('[speedService] client subscribed to PM');
    this._updateValueCallback = updateValueCallback;
    this._cumulativeRevs = -1;
    return this.RESULT_SUCCESS;
  };

  onUnsubscribe() {
    if (DEBUG) console.log('[speedService] client unsubscribed from PM');
    this._updateValueCallback = null;
    return this.RESULT_UNLIKELY_ERROR;
  };

  notify(event) {
    if (!('rpm' in event)) {
      // ignore events with no crank data
      return this.RESULT_SUCCESS;;
    }

    if (this._updateValueCallback) {
      if (DEBUG) console.log("[speedService] Notify, rpm: " + event.rpm);

      let currentTime = now();

      if (this._cumulativeRevs == -1) {
        this._cumulativeRevs = 0;
        this._lastNotify = currentTime;
        this._eventTimeBase = currentTime;
      }

      let deltaS = (currentTime - this._lastNotify) / 1000.0;
      this._lastNotify = currentTime;
      let rpmChunk = Math.round((event.rpm / 60.0) * deltaS);
      this._cumulativeRevs += rpmChunk;
      var eventDeltaS = (currentTime - this._eventTimeBase) / 1000.0;

      var eventTime = Math.round(eventDeltaS * 1024);
      let maxTime = 63 * 1024;
      if (eventTime > maxTime) {
        this._eventTimeBase = currentTime;
        while (eventTime > maxTime) {
          eventTime -= maxTime;
        }
      }

      var buffer = new Buffer.alloc(11);
      // flags
      // 00000001 - 1   - 0x001 - Wheel Revolution Data Present
      // 00000010 - 2   - 0x002 - Crank Revolution Data Present
      buffer.writeUInt8(0x02, 0);  // Flag: Have Crank Revolution Data
      buffer.writeUInt16LE(this._cumulativeRevs, 7);  // Cumulative crank revolutions
      buffer.writeUInt16LE(eventTime, 9)  // Last Crank Event Time  1/1024 of a second
	   
      this._updateValueCallback(buffer);
    }
    return this.RESULT_SUCCESS;
  }
  
  
};

module.exports = CyclingSpeedMeasurementCharacteristic;
