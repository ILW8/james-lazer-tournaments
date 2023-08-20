let socket = new ReconnectingWebSocket('ws://' + location.host + '/ws');

socket.onopen = () => { console.log('Successfully Connected'); };

socket.onclose = event => {
	console.log('Socket Closed Connection: ', event);
	socket.send('Client Closed!');
};

socket.onerror = error => { console.log('Socket Error: ', error); };

const params = new URLSearchParams(window.location.search);
const id = params.get('id');
const placeholder = params.get('placeholder');
const fontSize = params.get('fontSize');
const color = params.get('color');
let nameTemp = placeholder || '';

(() => {
	if (fontSize) {
		document.getElementById('name').style.fontSize = `${fontSize}px`
		document.getElementById('name-stroke').style.fontSize = `${fontSize}px`

		document.getElementById('name').style.bottom = `${Math.floor(fontSize / 2)}px`
		document.getElementById('name-stroke').style.bottom = `${Math.floor(fontSize / 2)}px`

		document.getElementById('name').style.right = `${Math.floor(fontSize / 2)}px`
		document.getElementById('name-stroke').style.right = `${Math.floor(fontSize / 2)}px`

		document.getElementById('name-stroke').style.webkitTextStroke = `${Math.floor(fontSize / 4)}px #ffffff`
		document.getElementById('name-stroke').style.textShadow = `${Math.floor(fontSize / 10)}px ${Math.floor(fontSize / 10)}px 0 #ffffff`
	}

	if (color) {
		document.getElementById('name').style.color = color == 'red' ? 'var(--red)' : 'var(--blue)';
	}
})();

socket.onmessage = async event => {
	let data = JSON.parse(event.data);

	if (nameTemp !== data.tourney.ipcClients[id].spectating.name) {
		nameTemp = data.tourney.ipcClients[id].spectating.name;
		document.getElementById('name').innerHTML = nameTemp == '' ? placeholder : nameTemp;
		document.getElementById('name-stroke').innerHTML = nameTemp == '' ? placeholder : nameTemp;
	}
}
