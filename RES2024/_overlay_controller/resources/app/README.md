# Resurrection Cup Overlay Controller
Overlay Controller for Resurrection Cup Mappool Overlay using Electron + React

## Installation Guide
- Download the latest release
- Extract it somewhere other than `C:\`
- Run `res-cup-controller-react.exe`
- Run osu!, gosumemory, Resurrection Cup Overlay

## Edit config
- First, make sure you head to `%appdata%/res-cup-controller-react/config.json` and set the `location` property to your **Resurrection Cup Overlay folder** location
- Edit the config at `<your_gosumemory_path>/static/ResCupOverlay/config.json`
- ~~`Win+R` then type `%appdata%`~~
- ~~Find a folder named `res-cup-controller-react`~~
- ~~Change `config.json` file as you wanted~~
- ~~> Note: The controller does not have hot reload, so you have to restart the controller for the changes to have effect!~~

## Developing
- Clone the repository by `git clone https://github.com/FukutoTojido/Resurrection-Cup-Overlay-Controller`
- `cd Resurrection-Cup-Overlay-Controller`, then `npm i`
- Start the controller by `npm run dev`
- To build the controller, run `npm run make`, the controller will be available in a folder called `out/res-cup-controller-react-win32-x64`

## Screenshot
![1](https://i.imgur.com/3c1y7MU.png)
