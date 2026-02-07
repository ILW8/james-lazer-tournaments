const DEBUG = false;
const cache = {};

const socket = new ReconnectingWebSocket(
  DEBUG ? 'ws://127.0.0.1:24051/' : `ws://${location.host}/websocket/v2`,
);
socket.onopen = () => {
  console.log('Successfully Connected');
};
socket.onclose = (event) => {
  console.log('Socket Closed Connection: ', event);
  socket.send('Client Closed!');
};
socket.onerror = (error) => {
  console.log('Socket Error: ', error);
};

socket.onmessage = async (event) => {
  const data = JSON.parse(event.data);

  if (cache.scoreVisible !== data.tourney.scoreVisible) {
		cache.scoreVisible = data.tourney.scoreVisible;

    if (cache.scoreVisible) $('#chat_container').css('opacity', 0);
    else $('#chat_container').css('opacity', 1);
	}

  if (cache.chatLen !== data.tourney.chat.length) {
    const current_chat_len = data.tourney.chat.length;
    if (
      cache.chatLen === 0 ||
      (cache.chatLen > 0 && cache.chatLen > current_chat_len)
    ) {
      $('#chat').html('');
      cache.chatLen = 0;
    }

    for (let i = cache.chatLen || 0; i < current_chat_len; i++) {
      const chat = data.tourney.chat[i];
      const body = chat.message;
      const timestamp = chat.timestamp;
      if (body.toLowerCase().startsWith('!mp')) {
        continue;
      }

      const player = chat.name;
      if (player === 'BanchoBot' && body.startsWith('Match history')) continue;

      const chatParent = $('<div></div>').addClass(`chat-message`);

      chatParent.append($('<div></div>').addClass('chat-time').text(timestamp));
      chatParent.append($('<div></div>').addClass(`chat-name`).text(player));
      chatParent.append($('<div></div>').addClass('chat-body').text(body));
      $('#chat').prepend(chatParent);
    }

    cache.chatLen = data.tourney.chat.length;
    cache.chat_loaded = true;
  }
};
