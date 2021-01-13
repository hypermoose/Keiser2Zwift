#!/bin/sh

hciconfig hci0 up
hciconfig hci1 up
/home/pi/.config/nvm/versions/node/v10.22.0/bin/node index.js

