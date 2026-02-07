const TEAMSIZE = 3;
const DEBUG = false;

const cache = {};
const timer = {
	in_progress: false,
	object: null,
	object_blink: null
};

let mappool, teams;
(async () => {
	$.ajaxSetup({ cache: false });
	mappool = await $.getJSON('../_data/beatmaps.json');
	// teams = await $.getJSON('../_data/teams.json');
	const stage = mappool.stage;
	if (stage) {
		$('#stage').text(stage);
		if (stage.toUpperCase() === 'QUARTERFINALS') $('#stage').addClass('qf');
	}
})();

const animation = {
	red_score: new CountUp('red_score', 0, 0, 0, .3, { useEasing: true, useGrouping: true, separator: ',', decimal: '.', suffix: '' }),
	blue_score: new CountUp('blue_score', 0, 0, 0, .3, { useEasing: true, useGrouping: true, separator: ',', decimal: '.', suffix: '' }),
}

const socket = new ReconnectingWebSocket(DEBUG ? 'ws://127.0.0.1:24051/' : `ws://${location.host}/websocket/v2`);
socket.onopen = () => { console.log('Successfully Connected'); };
socket.onclose = event => { console.log('Socket Closed Connection: ', event); socket.send('Client Closed!'); };
socket.onerror = error => { console.log('Socket Error: ', error); };

socket.onmessage = async event => {
	const data = JSON.parse(event.data);

	if (cache.scoreVisible !== data.tourney.scoreVisible) {
		cache.scoreVisible = data.tourney.scoreVisible;
	}

	if (cache.scoreVisible) {
		const scores = [];
		const ez_multiplier = cache.map?.ez_multiplier || 1;
		for (let i = 0; i < TEAMSIZE * 2; i++) {
			let score = data.tourney.clients[i]?.play?.score || 0;
			if (data.tourney.clients[i]?.play?.mods?.name?.toUpperCase().includes('EZ')) score *= ez_multiplier;
			scores.push({ id: i, score });
		}

		cache.scoreRed = scores.filter(s => s.id < TEAMSIZE).map(s => s.score).reduce((a, b) => a + b);
		cache.scoreBlue = scores.filter(s => s.id >= TEAMSIZE).map(s => s.score).reduce((a, b) => a + b);

		animation.red_score.update(cache.scoreRed);
		animation.blue_score.update(cache.scoreBlue);

		const max_width = 480;
		const min_width = 64;
		const max_team_score = 1200000 * TEAMSIZE;
		
		let red_bar_width, blue_bar_width;
		
		if (cache.scoreRed === 0 && cache.scoreBlue === 0) {
			red_bar_width = min_width;
			blue_bar_width = min_width;
		} else {
			const red_base = Math.pow(cache.scoreRed / max_team_score, 0.6);
			const blue_base = Math.pow(cache.scoreBlue / max_team_score, 0.6);
			
			red_bar_width = min_width + (max_width - min_width) * red_base;
			blue_bar_width = min_width + (max_width - min_width) * blue_base;
			
			const boost_amount = 1.15;
			if (cache.scoreRed > cache.scoreBlue) {
				red_bar_width = Math.min(max_width, red_bar_width * boost_amount);
			} else if (cache.scoreBlue > cache.scoreRed) {
				blue_bar_width = Math.min(max_width, blue_bar_width * boost_amount);
			}
		}

		$('#blue_bar').css('width', `${blue_bar_width}px`);
		$('#red_bar').css('width', `${red_bar_width}px`);
	}

	if (cache.chatLen !== data.tourney.chat.length) {
		const current_chat_len = data.tourney.chat.length;
		if (cache.chatLen === 0 || (cache.chatLen > 0 && cache.chatLen > current_chat_len)) { $('#chat').html(''); cache.chatLen = 0; }

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
}

const getModStats = (cs_raw, ar_raw, od_raw, bpm_raw, mods) => {
	mods = mods.replace('NC', 'DT');

	const speed = mods.includes('DT') ? 1.5 : mods.includes('HT') ? 0.75 : 1;

	let ar = mods.includes('HR') ? ar_raw * 1.4 : mods.includes('EZ') ? ar_raw * 0.5 : ar_raw;
	const ar_ms = Math.max(Math.min(ar <= 5 ? 1800 - 120 * ar : 1200 - 150 * (ar - 5), 1800), 450) / speed;
	ar = ar < 5 ? (1800 - ar_ms) / 120 : 5 + (1200 - ar_ms) / 150;

	const cs = mods.includes('HR') ? cs_raw * 1.3 : mods.includes('EZ') ? cs_raw * 0.5 : cs_raw;

	let od = Math.min(mods.includes('HR') ? od_raw * 1.4 : mods.includes('EZ') ? od_raw * 0.5 : od_raw, 10);
	if (speed !== 1) od = (79.5 - Math.min(79.5, Math.max(19.5, 79.5 - Math.ceil(6 * od))) / speed) / 6;

	return {
		cs: Math.round(cs * 10) / 10,
		ar: Math.round(ar * 10) / 10,
		od: Math.round(od * 10) / 10,
		bpm: Math.round(bpm_raw * speed * 10) / 10,
		speed
	}
}
