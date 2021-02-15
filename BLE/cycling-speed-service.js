const Bleno = require('@abandonware/bleno');

const CyclingSpeedMeasurementCharacteristic = require('./cycling-speed-measurement-characteristic');
const StaticReadCharacteristic = require('./static-read-characteristic');

class CyclingSpeedService extends Bleno.PrimaryService {

  constructor() {
    let speedMeasurement = new CyclingSpeedMeasurementCharacteristic();
    super({
        uuid: '1816',
        characteristics: [
          speedMeasurement,
          new StaticReadCharacteristic('2A5C', 'CSC Feature', [0x02, 0]), // CSC Feature  0000 0010 0000 0000
        ]
    });

    this.speedMeasurement = speedMeasurement;
  }

  notify(event) {
    this.speedMeasurement.notify(event);
    return this.RESULT_SUCCESS;
  };
}

module.exports = CyclingSpeedService;