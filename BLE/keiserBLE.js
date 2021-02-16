const bleno = require('@abandonware/bleno');
const EventEmitter = require('events');
const CyclingPowerService = require('./cycling-power-service');
const CyclingSpeedService = require('./cycling-speed-service');
const FitnessMachineService = require('./ftms-service');

var keiserDeviceId = -1;
var isPoweredOn = false;
var isAdvertising = false;

class KeiserBLE extends EventEmitter {

	constructor() {
		super();

		this.setName();		

		this.csp = new CyclingPowerService();
		this.css = new CyclingSpeedService();
		this.ftms = new FitnessMachineService(); 

		let self = this;
		console.log(`[${this.name} starting]`);

		bleno.on('stateChange', (state) => {
			console.log(`[${this.name} stateChange] new state: ${state}`);

			if (state === 'poweredOn') {
				isPoweredOn = true;
				this.checkStartConditions(); 
			//} else if (state === 'resetting') {
			} else {
				console.log('Stopping...');
				isPoweredOn = false;
				bleno.stopAdvertising();
				isAdvertising = false;
			}

			self.emit('stateChange', state);
		});

		bleno.on('advertisingStart', (error) => {
			console.log(`[${this.name} advertisingStart] ${(error ? 'error ' + error : 'success')}`);

			if (!error) {
				isAdvertising = true;
				bleno.setServices([self.csp, self.ftms],//, self.css], 
				(error) => {
					console.log(`[${this.name} setServices] ${(error ? 'error ' + error : 'success')}`);
				});
			}

			self.emit('advertisingStart', error);
		});

		bleno.on('advertisingStartError', () => {
			console.log(`[${this.name} advertisingStartError] advertising stopped`);
			isAdvertising = false;
			self.emit('advertisingStartError');
		});

		bleno.on('advertisingStop', error => {
			console.log(`[${this.name} advertisingStop] ${(error ? 'error ' + error : 'success')}`);
			isAdvertising = false;
			self.emit('advertisingStop');
		});

		bleno.on('servicesSet', error => {
			console.log(`[${this.name} servicesSet] ${ (error) ? 'error ' + error : 'success'}`);
		});

		bleno.on('accept', (clientAddress) => {
			console.log(`[${this.name} accept] Client: ${clientAddress}`);
			bleno.updateRssi();
			self.emit('accept', clientAddress);
		});

		bleno.on('disconnect', (clientAddress) => {
			console.log(`[${this.name} disconnect] Client: ${clientAddress}`);
			self.emit('disconnect', clientAddress);
		});

		bleno.on('rssiUpdate', (rssi) => {
			console.log(`[${this.name} rssiUpdate]: ${rssi}`);
		});

	}

	// notifiy BLE services
	notifyFTMS(event) {
		this.csp.notify(event);
		this.css.notify(event);
		this.ftms.notify(event);
	};

	setDeviceId(deviceId) {
		keiserDeviceId = deviceId;
		this.setName();
		this.checkStartConditions();
	}

	setName() {
		if (keiserDeviceId == -1) {
			this.name = "KeiserM3";
		} else {
			this.name = "KeiserM3-" + keiserDeviceId;
		}

		process.env['BLENO_DEVICE_NAME'] = this.name; 
	}

	checkStartConditions() {
		if (isPoweredOn && keiserDeviceId != -1 && !isAdvertising) {
			bleno.startAdvertising(this.name, [this.csp.uuid, this.ftms.uuid]);//, this.css.uuid]);
		}
	}
};

module.exports = KeiserBLE;