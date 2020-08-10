// Setup multi role support and two different adapters for Peripheral and Central
process.env['NOBLE_MULTI_ROLE'] = 1
process.env['NOBLE_REPORT_ALL_HCI_EVENTS'] = 1
process.env['BLENO_HCI_DEVICE_ID'] = 0
process.env['NOBLE_HCI_DEVICE_ID'] = 1

const noble = require('@abandonware/noble');
const keiserParser = require('./keiserParser.js')
const KeiserBLE = require('./BLE/keiserBLE')

var fillInTimer = null;
var dataToSend = null;
var connectedCount = 0;

console.log("Starting");

var keiserBLE = new KeiserBLE(serverCallback);

keiserBLE.on('advertisingStart', (client) => {
	//oled.displayBLE('Started');
});
keiserBLE.on('accept', (client) => {
	connectedCount++;
	//oled.displayBLE('Connected');
});
keiserBLE.on('disconnect', (client) => {
	connectedCount--;
	//oled.displayBLE('Disconnected');
});

function serverCallback(message, ...args) {
	var success = false;
	switch (message) {
	case 'reset':
		console.log('[server.js] - Bike reset');
		//kettlerUSB.restart();
		///bikeState.restart();
		success = true;
		break;

	case 'control':
		console.log('[server.js] - Bike is under control');
		//oled.setStatus(1);
		//bikeState.setControl();
		success = true;
		break;

	case 'power':
		// console.log('[server.js] - Bike in ERG Mode');
		//bikeState.setTargetPower(args[0]);
		success = true;
		break;

	case 'simulation': // SIM Mode - calculate power based on physics
		//console.log('[server.js] - Bike in SIM Mode');
		/*var windspeed = Number(args[0]);
		var grade = Number(args[1]);
		var crr = Number(args[2]);
		var cw = Number(args[3]);
		// console.log('[server.js] - Bike SIM Mode - [wind]: ' + (windspeed * 3.6).toFixed(1) + 'hm/h [grade]: ' + grade.toFixed(1) + '% [crr]: ' + crr + ' [cw]: ' + cw)

        bikeState.setExternalCondition(windspeed, grade, crr, cw);
        */
		// nothing special
		success = true;
		break;
	}
	return success;
};

noble.on('stateChange', async (state) => {
    console.log(`[Central] State changed to ${state}`);
    if (state === 'poweredOn') {
    	console.log(`[Central] starting scan`);
        await noble.startScanningAsync(null, true);
    } else if (state === 'poweredOff') {
		console.log('No adapter detected, exiting in 5 seconds');
		setTimeout(() => {
			process.exit();	
		}, 5000);
    }
});

function sendFillInData() {
	if (!dataToSend || (connectedCount < 1)) {
		console.log("Aborting nothing to send");
	}

	console.log("Sending fill in data");
	keiserBLE.notifyFTMS(dataToSend);
	fillInTimer = setTimeout(sendFillInData, 1000);
}

noble.on('discover', (peripheral) => {

   	//console.log(`[Central] Found device ${peripheral.advertisement.localName} ${peripheral.address}`); 
	if (peripheral.advertisement.localName == "M3") 
	{
        try
        {
            var result = keiserParser.parseAdvertisement(peripheral);
			//console.log(`[Central] Found M3 device ${peripheral.advertisement.localName} ${peripheral.address} ${result.buildMajor} ${result.buildMinor}`); 
			if (result.ordinalId == 2) {
				console.log(`Bike ${result.ordinalId}: ${result.realTime} ${result.cadence} ${result.power} ${result.gear} ${result.duration}`); 
				if (result.realTime) {
					dataToSend = { 
						rpm: result.cadence, 
						power: result.power,
						hr: result.heartRate,
						speed: result.cadence * .73  // 30 cog 34 cassette for now
					};
					if (fillInTimer) {
						clearTimeout(fillInTimer);
						fillInTimer = null;
					}

					if (connectedCount > 0) {
						keiserBLE.notifyFTMS(dataToSend);
						fillInTimer = setTimeout(sendFillInData, 1000);
					}
				}
			}
        } 
        catch { 
            console.log("\tError parsing")
        }
    }
});
