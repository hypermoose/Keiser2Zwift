// Doc: https://www.bluetooth.com/specifications/gatt/viewer?attributeXmlFile=org.bluetooth.service.fitness_machine.xml
const Bleno = require('@abandonware/bleno');

const IndoorBikeDataCharacteristic = require('./indoor-bike-data-characteristic');
const StaticReadCharacteristic = require('./static-read-characteristic');
const FitnessMachineStatusCharacteristic = require('./fitness-machine-status-characteristic');

class FitnessMachineService extends Bleno.PrimaryService {

	constructor() {

		let indoorBikeData = new IndoorBikeDataCharacteristic();
		let fitnessMachineStatus = new FitnessMachineStatusCharacteristic()

			super({
				uuid: '1826',
				characteristics: [
					new StaticReadCharacteristic('2ACC', 'Fitness Machine Feature', [0x02, 0x44, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]), // Feature Characteristics
					indoorBikeData,
					fitnessMachineStatus
				]
			});

		this.indoorBikeData = indoorBikeData;
	}

	/*
	 * Transfer event from Kettler USB to the given characteristics
	 */
	notify(event) {
		this.indoorBikeData.notify(event);
	};

}

module.exports = FitnessMachineService;
