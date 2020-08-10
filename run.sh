#!/bin/sh

hciconfig hci0 up
hciconfig hci1 up
/home/pi/.config/nvm/versions/node/v12.16.1/bin/node index.js

