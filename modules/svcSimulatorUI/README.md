# ISO UI simulator

## 1. Running

The following software should be installed on your system to run the toolkit.

* Git
* Docker

Please execute the following lines to build and run the application. 

```bash
git clone https://github.com/vijayg10/iso-sim-ui
cd ml-testing-toolkit-ui
docker-compose up
```

To update the testing-toolkit-ui to the latest version and rebuild, please run the following
```bash
cd iso-sim-ui
git pull
docker-compose build
docker-compose up
```

## 2. Ports

You can get the web interface on http://localhost:7070/

