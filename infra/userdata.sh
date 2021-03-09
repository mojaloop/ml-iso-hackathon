#!/bin/bash

echo 'hello world' > ~/i_was_here

# on boot, install docker and docker-compose
apt update \
  && apt install apt-transport-https ca-certificates curl software-properties-common -y \
  && curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add - \
  && add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu bionic stable" \
  && apt update \
  && apt install docker-ce -y \
  && systemctl enable docker \
  && systemctl start docker \
  && curl -L https://github.com/docker/compose/releases/download/1.25.4/docker-compose-`uname -s`-`uname -m` \
        -o /usr/local/bin/docker-compose \
  && chmod +x /usr/local/bin/docker-compose \
  && sed -i.bak "s/.*MaxSessions.*/MaxSessions 30/" /etc/ssh/sshd_config \
  && systemctl restart ssh
