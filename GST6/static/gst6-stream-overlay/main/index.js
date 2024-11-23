let stage_data;
(async () => {
	$.ajaxSetup({ cache: false });
	stage_data = await $.getJSON('../_data/beatmaps.json');
})();

const animation = {
	red_score: new CountUp('score_red', 0, 0, 0, .3, { useEasing: true, useGrouping: true, separator: ',', decimal: '.' }),
	red_score_s: new CountUp('score_red_stroke', 0, 0, 0, .3, { useEasing: true, useGrouping: true, separator: ',', decimal: '.' }),
	blue_score: new CountUp('score_blue', 0, 0, 0, .3, { useEasing: true, useGrouping: true, separator: ',', decimal: '.' }),
	blue_score_s: new CountUp('score_blue_stroke', 0, 0, 0, .3, { useEasing: true, useGrouping: true, separator: ',', decimal: '.' }),
}

const socket = new ReconnectingWebSocket('ws://' + location.host + '/websocket/v2');

socket.onopen = () => { console.log('Successfully Connected'); };
socket.onclose = event => { console.log('Socket Closed Connection: ', event); socket.send('Client Closed!'); };
socket.onerror = error => { console.log('Socket Error: ', error); };

let label_visible = false;
window.setInterval(async () => {
	if (!cache.mapid) return;
	const picks = JSON.parse(localStorage.getItem('picks'));
	const this_map = picks.find(e => e.beatmap_id === cache.mapid);
	if (!this_map) {
		if (!label_visible) return;
		else { $('#pick_label').css('opacity', '0'); return; }
	}
	else {
		$('#pick_label').css('opacity', '1').css('background-color', `var(--${this_map.color})`);
		return;
	}
}, 500);

const cache = {};

socket.onmessage = async event => {
	const data = JSON.parse(event.data);

	if (cache.scoreVisible !== data.tourney.scoreVisible) {
		cache.scoreVisible = data.tourney.scoreVisible;
	}

	if (data.tourney.team.left && cache.nameRed !== data.tourney.team.left) {
		cache.nameRed = data.tourney.team.left;
		$('#name_red').text(cache.nameRed);
		$('#name_red_stroke').text(cache.nameRed);
	}

	if (data.tourney.team.right && cache.nameBlue !== data.tourney.team.right) {
		cache.nameBlue = data.tourney.team.right;
		$('#name_blue').text(cache.nameBlue);
		$('#name_blue_stroke').text(cache.nameBlue);
	}

	if (cache.bestOf !== data.tourney.bestOF) {
		const newmax = Math.ceil(data.tourney.bestOF / 2);
		if (cache.bestOf === undefined) {
			for (let i = 1; i <= newmax; i++) {
				$('#points_red').append($('<div></div>').attr('id', `red${i}`).addClass('team-point'));
				$('#points_blue').append($('<div></div>').attr('id', `blue${i}`).addClass('team-point'));
			}
		}
		else if (cache.bestOf < data.tourney.bestOF) {
			for (let i = cache.firstTo + 1; i <= newmax; i++) {
				$('#points_red').append($('<div></div>').attr('id', `red${i}`).addClass('team-point'));
				$('#points_blue').append($('<div></div>').attr('id', `blue${i}`).addClass('team-point'));
			}
		}
		else {
			for (let i = cache.firstTo; i > newmax; i--) {
				$(`#red${i}`).remove();
				$(`#blue${i}`).remove();
			}
		}
		cache.bestOf = data.tourney.bestOF;
		cache.firstTo = newmax;
	}

	if (cache.starsRed !== data.tourney.points.left) {
		cache.starsRed = data.tourney.points.left;
		for (let i = 1; i <= cache.starsRed; i++) { $(`#red${i}`).addClass('filled'); }
		for (let i = cache.starsRed + 1; i <= cache.firstTo; i++) { $(`#red${i}`).removeClass('filled'); }
	}

	if (cache.starsBlue !== data.tourney.points.right) {
		cache.starsBlue = data.tourney.points.right;
		for (let i = 1; i <= cache.starsBlue; i++) { $(`#blue${i}`).addClass('filled'); }
		for (let i = cache.starsBlue + 1; i <= cache.firstTo; i++) { $(`#blue${i}`).removeClass('filled'); }
	}

	if (cache.image !== data.directPath.beatmapBackground) {
		cache.image = data.directPath.beatmapBackground;
		const fixed_image = cache.image.replace(/#/g, '%23').replace(/%/g, '%25').replace(/\\/g, '/').replace(/'/g, `\\'`);
		$('#map_image').css('background-image', `url('http://${location.host}/Songs/${fixed_image}')`);
	}

	if (cache.md5 !== data.beatmap.checksum || (stage_data && !cache.first_update)) {
		cache.md5 = data.beatmap.checksum;
		cache.first_update = true;
		setTimeout(() => { cache.update_stats = true }, 250);
	}

	if (cache.update_stats) {
		cache.update_stats = false;
		cache.mapid = data.beatmap.id;
		cache.map = stage_data ? stage_data?.beatmaps.find(m => m.beatmap_id == cache.mapid || m.md5 == cache.md5) ?? { id: cache.mapid, mods: 'NM', identifier: null } : { id: null, mods: 'NM', identifier: null };
		const mods = cache.map?.mods ?? 'NM';
		const stats = getModStats(data.beatmap.stats.cs.original, data.beatmap.stats.ar.original, data.beatmap.stats.od.original, data.beatmap.stats.bpm.common, mods);
		const len_ = data.beatmap.time.lastObject - data.beatmap.time.firstObject;

		$('#cs').text(stats.cs);
		$('#ar').text(stats.ar);
		$('#od').text(stats.od);
		$('#bpm').text(cache.map?.bpm ?? stats.bpm);
		$('#len').text(`${Math.trunc((len_ / stats.speed) / 1000 / 60)}:${Math.trunc((len_ / stats.speed) / 1000 % 60).toString().padStart(2, '0')}`);
		$('#sr').html(`${cache.map?.sr ?? data.beatmap.stats.stars.total}`);

		$('#title').text(data.beatmap.title);
		$('#artist').text(data.beatmap.artist);

		$('#map_slot').text(cache.map.identifier || 'XX');
		$('#map_slot_stroke').text(cache.map.identifier || 'XX');
	}

	if (cache.scoreVisible) {
		let scores = [];
		for (let i = 0; i < 4; i++) {
			const client = data.tourney.clients[i];
			let score = client.play.score;
			if (client.play.mods.name.toUpperCase().includes('HD') && !cache?.map?.mods?.includes('HD')) score /= 1.06;
			scores.push({ id: i, score });
		}

		let scoreRed = scores.filter(s => [0, 1].includes(s.id)).map(s => s.score).reduce((a, b) => a + b);
		let scoreBlue = scores.filter(s => [2, 3].includes(s.id)).map(s => s.score).reduce((a, b) => a + b);

		let scoreDiff = Math.abs(scoreRed - scoreBlue);
		let leadWidth = 400 * (Math.min(0.5, Math.pow(scoreDiff / 1400000, 0.7)) * 2);

		animation.red_score.update(scoreRed);
		animation.red_score_s.update(scoreRed);
		animation.blue_score.update(scoreBlue);
		animation.blue_score_s.update(scoreBlue);

		if (scoreRed > scoreBlue) {
			$('#score_container_red').addClass('winning');
			$('#score_container_blue').removeClass('winning');

			$('#scorebar_red').addClass('winning');
			$('#scorebar_red').css('width', leadWidth + 'px');
			$('#scorebar_blue').removeClass('winning');
			$('#scorebar_blue').css('width', '0px');
		}
		else if (scoreBlue > scoreRed) {
			$('#score_container_red').removeClass('winning');
			$('#score_container_blue').addClass('winning');

			$('#scorebar_red').removeClass('winning');
			$('#scorebar_red').css('width', '0px');
			$('#scorebar_blue').addClass('winning');
			$('#scorebar_blue').css('width', leadWidth + 'px');
		}
		else {
			$('#score_container_red').removeClass('winning');
			$('#score_container_blue').removeClass('winning');

			$('#scorebar_red').removeClass('winning');
			$('#scorebar_red').css('width', '0px');
			$('#scorebar_blue').removeClass('winning');
			$('#scorebar_blue').css('width', '0px');
		}
	}

	if (cache.chatLen !== data.tourney.chat.length) {
		const current_chat_len = data.tourney.chat.length;
		if (!cache.chatLen || (cache.chatLen > 0 && cache.chatLen > current_chat_len)) { $('#chat').html(''); cache.chatLen = 0; }

		for (let i = cache.chatLen; i < current_chat_len; i++) {
			const chat = data.tourney.chat[i];
			const body = chat.message;
			if (body.toLowerCase().startsWith('!mp')) continue;
			else {
				const team = chat.team;
				const player = chat.name;
				if (player === 'BanchoBot' && body.startsWith('Match history')) continue;

				const chatParent = $('<div></div>').addClass(`chat-message ${team}`);

				chatParent.append($('<div></div>').addClass('chat-name').text(player));
				chatParent.append($('<div></div>').addClass('chat-body').text(body));

				$('#chat').prepend(chatParent);
			}
		}

		cache.chatLen = data.tourney.chat.length;
	}
}

const getModStats = (cs_raw, ar_raw, od_raw, bpm_raw, mods) => {
	mods = mods.replace('NC', 'DT');

	let speed = mods.includes('DT') ? 1.5 : mods.includes('HT') ? 0.75 : 1;
	let ar = mods.includes('HR') ? ar_raw * 1.4 : mods.includes('EZ') ? ar_raw * 0.5 : ar_raw;

	let ar_ms = Math.max(Math.min(ar <= 5 ? 1800 - 120 * ar : 1200 - 150 * (ar - 5), 1800), 450) / speed;
	ar = ar < 5 ? (1800 - ar_ms) / 120 : 5 + (1200 - ar_ms) / 150;

	let cs = Math.round(Math.min(mods.includes('HR') ? cs_raw * 1.3 : mods.includes('EZ') ? cs_raw * 0.5 : cs_raw, 10) * 10) / 10;

	let od = mods.includes('HR') ? od_raw * 1.4 : mods.includes('EZ') ? od_raw * 0.5 : od_raw;
	od = Math.round(Math.min((79.5 - Math.min(79.5, Math.max(19.5, 79.5 - Math.ceil(6 * od))) / speed) / 6, 11) * 10) / 10;

	return {
		cs: Math.round(cs * 10) / 10,
		ar: Math.round(ar * 10) / 10,
		od: Math.round(od * 10) / 10,
		bpm: Math.round(bpm_raw * speed * 10) / 10,
		speed
	}
}
