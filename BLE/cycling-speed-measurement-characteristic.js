
var Bleno = require('@abandonware/bleno');
var DEBUG = false;

class CyclingSpeedMeasurementCharacteristic extends  Bleno.Characteristic {
 
  constructor() {
    super({
      uuid: '2A5B',
      value: null,
      properties: ['notify'],
      descriptors: [
        new Bleno.Descriptor({
					uuid: '2901',
					value: 'CSC Measurement'
				}),
        new Bleno.Descriptor({
          // Client Characteristic Configuration
          uuid: '2902',
          value: Buffer.alloc(2)
        }),
        new Bleno.Descriptor({
          // Server Characteristic Configuration
          uuid: '2903',
          value: Buffer.alloc(2)
        })
      ]
    });
    this._updateValueCallback = null;  
  }

  onSubscribe(maxValueSize, updateValueCallback) {
    if (DEBUG) console.log('[speedService] client subscribed to PM');
    this._updateValueCallback = updateValueCallback;
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
		if (DEBUG) console.log("[speedService] Notify");
		var buffer = new Buffer(11);
		// flags
		// 00000001 - 1   - 0x001 - Wheel Revolution Data Present
		// 00000010 - 2   - 0x002 - Crank Revolution Data Present
		buffer.writeUInt8(0x02, 0);  // Flag: Have Crank Revolution Data

    buffer.writeUInt32LE(0, 1);  // 4  // Wheel Revolutions

    buffer.writeUInt16LE(0, 5);  // Last Wheel Event Time

    buffer.writeUInt16LE(1, 7);  // Cumulative crank revolutions

    buffer.writeUint16LE(2, 9)  // Last Crank Event Time
	   
		if ('rpm' in event) {
		  var power = event.power;
		  if (DEBUG) console.log("[powerService] power: " + power);
		  buffer.writeInt16LE(power, 2);
		}
	  
		if ('rpm' in event) {
		  var rpm = event.rpm;
		  if (DEBUG) console.log("[powerService] rpm: " + event.rpm);
		  buffer.writeUInt16LE(rpm * 2, 4);
		}
      this._updateValueCallback(buffer);
    }
    return this.RESULT_SUCCESS;
  }
  
  
};

module.exports = CyclingPowerMeasurementCharacteristic;
