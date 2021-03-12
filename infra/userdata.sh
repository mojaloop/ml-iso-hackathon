#!/bin/bash

echo 'hello world' > ~/i_was_here

# on boot, install docker and docker-compose
apt update
apt install apt-transport-https ca-certificates curl software-properties-common -y

# Install docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add - 
add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu bionic stable" 
apt update 
apt install docker-ce -y 
groupadd docker
sudo usermod -aG docker ubuntu

systemctl enable docker 
systemctl start docker 

if [ ! -f /usr/local/bin/docker-compose ]; then
  echo 'installing docker-compose'
  # install docker compose 
  curl -L https://github.com/docker/compose/releases/download/1.25.4/docker-compose-`uname -s`-`uname -m` -o /usr/local/bin/docker-compose
  chmod +x /usr/local/bin/docker-compose
fi

# ssh setup
sed -i.bak "s/.*MaxSessions.*/MaxSessions 30/" /etc/ssh/sshd_config
mkdir -p /home/ubuntu/.ssh/

echo 'YAY' > ~/userdata_completed

reboot now
