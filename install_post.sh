#!/bin/bash

# Stop any existing services
echo "Stopping old service..."
systemctl stop rn.sacn-scene-recorder.service

# Remove old files
echo "Removing old files..."
rm -v /usr/local/bin/sacn-scene-recorder
rm -r /usr/local/share/sacn-scene-recorder
echo "removed '/usr/local/share/sacn-scene-recorder'"
rm -v /lib/systemd/system/rn.sacn-scene-recorder.service

# Copy files
echo "Copying files..."
cp -v systemd/sacn-scene-recorder.sh /usr/local/bin/sacn-scene-recorder
mkdir -p /usr/local/share/sacn-scene-recorder
echo "'.' -> '/usr/local/share/sacn-scene-recorder'"
cp -a . /usr/local/share/sacn-scene-recorder/
cp -v systemd/rn.sacn-scene-recorder.service /lib/systemd/system/

# Reload SystemD files
echo "Reloading daemon definitions..."
systemctl daemon-reload

# Enable, restart and print status of services
echo "Starting service..."
systemctl enable rn.sacn-scene-recorder.service
systemctl start rn.sacn-scene-recorder.service
systemctl status rn.sacn-scene-recorder.service
