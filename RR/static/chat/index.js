let socket = new ReconnectingWebSocket('ws://' + location.host + '/ws');

let chat_container = document.getElementById('chat-container');
let chat = document.getElementById('chat');

socket.onopen = () => { console.log('Successfully Connected'); };

socket.onclose = event => {
	console.log('Socket Closed Connection: ', event);
	socket.send('Client Closed!');
};

socket.onerror = error => { console.log('Socket Error: ', error); };

let scoreVisible;
let chatLen = 0;
let tempClass = 'unknown';

socket.onmessage = async event => {
	let data = JSON.parse(event.data);


	if (scoreVisible !== data.tourney.manager.bools.scoreVisible) {
		scoreVisible = data.tourney.manager.bools.scoreVisible;
		chat_container.style.opacity = scoreVisible ? 0 : 1;
	}

	if (!scoreVisible) {
		if (chatLen != data.tourney.manager.chat.length) {

			if (chatLen == 0 || (chatLen > 0 && chatLen > data.tourney.manager.chat.length)) { chat.innerHTML = ''; chatLen = 0; }

			for (let i = chatLen; i < data.tourney.manager.chat.length; i++) {
				tempClass = data.tourney.manager.chat[i].team;

				let text = data.tourney.manager.chat[i].messageBody;
				if (data.tourney.manager.chat[i].name == 'BanchoBot' && text.startsWith('Match history')) continue;

				let chatParent = document.createElement('div');
				chatParent.setAttribute('class', 'chat');

				let chatTime = document.createElement('div');
				chatTime.setAttribute('class', 'chatTime');

				let chatName = document.createElement('div');
				chatName.setAttribute('class', 'chatName');

				let chatText = document.createElement('div');
				chatText.setAttribute('class', 'chatText');

				chatTime.innerText = data.tourney.manager.chat[i].time;
				chatName.innerText = data.tourney.manager.chat[i].name + ': \xa0';
				chatText.innerText = text;

				chatName.classList.add(tempClass);

				chatParent.append(chatTime);
				chatParent.append(chatName);
				chatParent.append(chatText);
				chat.append(chatParent);

			}

			chatLen = data.tourney.manager.chat.length;
			chat.scrollTop = chat.scrollHeight;
		}
	}
}