# Keiser2Zwift

Use your Keiser M3 bike with apps like Zwift without buying a converter from Keiser which never really worked for me.  This project was built to use make use of a Raspberry pi
with 2 bluetooth adapters.  Other systems may work but your on your own to get it setup.  Two bluetooth adapters are required to make this work.  I use the built in one on a Raspberry Pi 3/4 or the Pi Zero W
and an additional one plugged into the usb port.   The steps to install are below.

# USB bluetooth adapters known to work
Any one available from Amazon with linux support should work but I have tried these:
- https://www.amazon.com/gp/product/B0775YF36R/ref=ppx_yo_dt_b_search_asin_title?ie=UTF8&psc=1
- https://www.amazon.com/IOGEAR-Bluetooth-Micro-Adapter-GBU521/dp/B007GFX0PY/ref=sr_1_1?dchild=1&keywords=iogear+bluetooth&qid=1599502460&s=electronics&sr=1-1

# Installation
1. Setup your Pi with Raspbian or Raspbian Lite. https://www.raspberrypi.org/downloads/
2. Disable the default bluetooth service.  Note that I actually move the file to a backup location to make sure it doesnt come back after a reboot.
    * ```sudo systemctl stop bluetooth```
    * ```sudo systemctl disable bluetooth```
    * ```sudo mv /usr/lib/bluetoothd bluetoothd.bak```
3. Install the development requirements
    * ```sudo apt-get install bluetooth bluez libbluetooth-dev libudev-dev```
4. Install NVVM to manager Node.js versions (Make sure to close and reopen your shell after this step)
    * ```curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash```
5. Install the latest binary build of Node.js to support Pis (anything newer and your need to spend a lot time with building it)
    * ```nvm install 10.22.0```
6. Download this repo or clone it locally.  I put it in a directory off the home folder for pi called /home/pi/code/keiser
7. Go to that directory and run
    * ```npm install```
8. Make sure both bluetooth adapters are connected and issues the following two commands
    * ```sudo hciconfig hci0 up```
    * ```sudo hciconfig hci1 up```
9. Verify that you see two devices when you run:
    * ``` hcitool dev```
10. Start this project manually.  You should see log messages that indicate its looking for an M3i.
    * ``` npm start```
11. Wake up your bike and do a few revolutions of the pedals.  You should see log messages indicating that its connected to that bike
12. Launch Zwift and connect to the Power meter whose name starts with KeiserM3-<your bike id>.  Then connect to the Cadence sensor.   Enjoy
  
# Setting up to always run
You can setup the program to run at Pi boot time by doing the following steps:
1. Edit the keiser.service file in the root of this project to change the path if you didnt take my suggestion.
2. Copy the service definition into the correct location
      * ```sudo cp keiser.service /etc/systemd/system```
3. Enable the service
      * ```sudo systemctl enable keiser```
4. Start the service (Make sure you aren't still manually running the project using npm)
      * ```sudo systemctl start keiser```
5. Verify it started
      * ```systemctl status keiser```
6. Reboot the system and verify that the service started automatically using step 5

# Thanks
I leveraged several other great projects to build this.  They are:
- Bleno: https://github.com/abandonware/bleno
- Noble: https://github.com/abandonware/noble
- KettlerUSB2BLE: https://github.com/360manu/kettlerUSB2BLE
