
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

      if (this._cumulativeRevs = -1) {
        this._cumulativeRevs = 0;
        this._lastNotify = now();
        this._eventTimeBase = now();
      }

      let deltaS = (now() - this._lastNotify) / 1000.0;
      this._lastNotify = now();
      let rpmChunk = (event.rpm / 60.0) * deltaS;
      this._cumulativeRevs += rpmChunk;
      let eventDeltaS = (now() = this._eventTimeBase) / 1000.0;
      if (eventDeltaS > 64) {
        this._eventTimeBase = now();
        while (eventDeltaS > 64) {
          eventDeltaS -= 64;
        }
      }
      let eventTime = eventDeltaS / 1024;

      var buffer = new Buffer.alloc(11);
      // flags
      // 00000001 - 1   - 0x001 - Wheel Revolution Data Present
      // 00000010 - 2   - 0x002 - Crank Revolution Data Present
      buffer.writeUInt8(0x02, 0);  // Flag: Have Crank Revolution Data
      buffer.writeUInt16LE(1, Match.round(rpmChunk));  // Cumulative crank revolutions
      buffer.writeUint16LE(2, Math.round(eventTime))  // Last Crank Event Time  1/1024 of a second
	   
      this._updateValueCallback(buffer);
    }
    return this.RESULT_SUCCESS;
  }
  
  
};

module.exports = CyclingSpeedMeasurementCharacteristic;
