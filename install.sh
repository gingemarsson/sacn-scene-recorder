#!/bin/bash

if [[ $EUID == 0 ]] ; then
    echo "Please don't run this as root, it will use sudo when required."
    exit 1
fi

# Run pre-install tasks
sudo ./install_pre.sh

# Install dependencies
yarn install

# Check/fix config files
echo -n "Checking for file '.env.local'... "
if [ -f .env.local ] ; then
    echo "ok"
else
    echo "failed"
    exit 1
fi
echo -n "Checking for file 'scenes.sqlite3'... "
if [ -f scenes.sqlite3 ] ; then
    echo "ok"
else
    echo "failed, will create a new database from template"
fi
yarn migrate

# Run post-install tasks
sudo ./install_post.sh

# Albert
echo "🫖 I am a teapot. 🫖"
