let socket = new ReconnectingWebSocket('ws://' + location.host + '/ws');

socket.onopen = () => { console.log('Successfully Connected'); };
socket.onclose = event => { console.log('Socket Closed Connection: ', event); socket.send('Client Closed!'); };
socket.onerror = error => { console.log('Socket Error: ', error); };

const params = new URLSearchParams(window.location.search);
const id = params.get('id');
const placeholder = params.get('placeholder');
const fontSize = params.get('fontSize');
const color = params.get('color');
const radius = params.get('radius');
const bgFlash = params.get('flashBackground');
const debug = params.get('debug');

console.log(params);

let nameTemp = placeholder || '';
let combo = 0;
let comboThreshold = 10;
let nameText = document.getElementById('name');
let nameStroke = document.getElementById('name-stroke');
let background = document.getElementById('full-overlay');

(() => {
	if (fontSize) {
		nameText.style.fontSize = `${fontSize}px`
		nameStroke.style.fontSize = `${fontSize}px`

		nameText.style.bottom = `${Math.floor(fontSize / 2)}px`
		nameStroke.style.bottom = `${Math.floor(fontSize / 2)}px`

		nameText.style.right = `${Math.floor(fontSize / 2)}px`
		nameStroke.style.right = `${Math.floor(fontSize / 2)}px`
	}

	if (debug == 'true') {
		background.style.backgroundColor = `rgba(255, 87, 87, 1)`;
	}

	if (color) {
		nameText.style.color = color == 'red' ? 'var(--red)' : 'var(--blue)';
	}

	if (id == 0) background.style.borderRadius = `22px 10px 10px 10px`;
	if (id == 1) background.style.borderRadius = `10px 10px 10px 22px`;
	if (id == 2) background.style.borderRadius = `10px 22px 10px 10px`;
	if (id == 3) background.style.borderRadius = `10px 10px 22px 10px`;
})();

socket.onmessage = async event => {
	let data = JSON.parse(event.data);
	let client = data.tourney.ipcClients[id];

	if (nameTemp !== client.spectating.name) {
		nameTemp = client.spectating.name;
		nameText.innerHTML = nameTemp == '' ? placeholder : nameTemp;
		nameStroke.innerHTML = nameTemp == '' ? placeholder : nameTemp;
	}

	if (data.tourney.manager.bools.scoreVisible && combo >= 10 && client.gameplay.combo.current < combo) {
		if (bgFlash) {
			background.style.transition = 'background-color 100ms cubic-bezier(0, 1, 0.4, 1)';
			background.style.backgroundColor = 'rgba(255, 87, 87, 0.2)';
		}

		nameText.style.transition = 'transform 100ms cubic-bezier(0, 1, 0.4, 1)';
		nameText.style.transform = 'scale(1.2)';
		nameStroke.style.transition = 'transform 100ms cubic-bezier(0, 1, 0.4, 1)';
		nameStroke.style.transform = 'scale(1.2)';

		setTimeout(() => {
			if (bgFlash) {
				background.style.transition = 'background-color 800ms cubic-bezier(0.42, 0.04, 0.49, 0.97)';
				background.style.backgroundColor = 'rgba(255, 87, 87, 0)';
			}

			nameText.style.transition = 'transform 500ms cubic-bezier(0.42, 0.04, 0.49, 0.97)';
			nameText.style.transform = 'scale(1.0)';
			nameStroke.style.transition = 'transform 500ms cubic-bezier(0.42, 0.04, 0.49, 0.97)';
			nameStroke.style.transform = 'scale(1.0)';
		}, 150);
	}
	combo = client.gameplay.combo.current;
}
