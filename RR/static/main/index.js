let mappool;
(async () => {
	$.ajaxSetup({ cache: false });
	mappool = await $.getJSON('../_data/beatmaps.json');
})();

let socket = new ReconnectingWebSocket('ws://' + location.host + '/ws');

let title = document.getElementById('song-title');
let title_stroke = document.getElementById('song-title-stroke');
let sr = document.getElementById('sr');
let cs = document.getElementById('cs');
let ar = document.getElementById('ar');

let red_name = document.getElementById('red-name');
let red_name_stroke = document.getElementById('red-name-stroke');
let red_picklabel = document.getElementById('red-picklabel');
let red_score = document.getElementById('score-red');
let red_score_stroke = document.getElementById('score-red-stroke');
let blue_name = document.getElementById('blue-name');
let blue_name_stroke = document.getElementById('blue-name-stroke');
let blue_picklabel = document.getElementById('blue-picklabel');
let blue_score = document.getElementById('score-blue');
let blue_score_stroke = document.getElementById('score-blue-stroke');

let red_points = document.getElementById('red-points');
let blue_points = document.getElementById('blue-points');

let red_girl = document.getElementById('animegirl-red');
let blue_girl = document.getElementById('animegirl-blue');

let lead_bar = document.getElementById('lead-bar');
let top_footer = document.getElementById('footer');

socket.onopen = () => { console.log('Successfully Connected'); };

let animation = {
	red_score: new CountUp('score-red', 0, 0, 0, .3, { useEasing: true, useGrouping: true, separator: ',', decimal: '.', suffix: '' }),
	red_score_stroke: new CountUp('score-red-stroke', 0, 0, 0, .3, { useEasing: true, useGrouping: true, separator: ',', decimal: '.', suffix: '' }),
	blue_score: new CountUp('score-blue', 0, 0, 0, .3, { useEasing: true, useGrouping: true, separator: ',', decimal: '.', suffix: '' }),
	blue_score_stroke: new CountUp('score-blue-stroke', 0, 0, 0, .3, { useEasing: true, useGrouping: true, separator: ',', decimal: '.', suffix: '' }),
}

socket.onclose = event => {
	console.log('Socket Closed Connection: ', event);
	socket.send('Client Closed!');
};

socket.onerror = error => { console.log('Socket Error: ', error); };

let title_, md5;
let last_score_update = 0;
let last_girl_update = 0;

let bestOf, firstTo;
let scoreVisible, starsVisible;
let starsRed, scoreRed, nameRed;
let starsBlue, scoreBlue, nameBlue;

let map, mapid;

window.setInterval(async () => {
	await delay(200);
	let cookieName = 'lastPick';
	const match = document.cookie.match(`(?:^|.*)${cookieName}=(.+?)(?:$|[|;].*)`);

	let checkValid = () => {
		if (!mapid) return -9;
		if (match) {
			let cookieValue = match[1].split('-');
			if (cookieValue.length !== 2) return -1;  // expected format: <beatmap_id>-<picking_team>
			const parsedBeatmapID = parseInt(cookieValue[0]);
			if (isNaN(parsedBeatmapID)) return -2;

			// if (true) {  // bypass beatmap id checking during development
			if (mapid == parsedBeatmapID) {
				let map_obj = mappool.beatmaps.find(m => m.beatmap_id == mapid);
				if (map_obj?.identifier?.toUpperCase().includes('TB')) return -3;

				if (cookieValue[1] === 'red') {
					red_picklabel.style.opacity = 1;
					blue_picklabel.style.opacity = 0;
				}
				else {
					red_picklabel.style.opacity = 0;
					blue_picklabel.style.opacity = 1;
				}

				return 0;
			}
			return -255;
		}
	}

	if (checkValid() !== 0) {
		red_picklabel.style.opacity = 0;
		blue_picklabel.style.opacity = 0;
	}
}, 500);

socket.onmessage = async event => {
	let data = JSON.parse(event.data);

	if (mapid != data.menu.bm.id) { await delay(200); mapid = data.menu.bm.id; }

	if (scoreVisible !== data.tourney.manager.bools.scoreVisible) {
		scoreVisible = data.tourney.manager.bools.scoreVisible;
		top_footer.style.opacity = scoreVisible ? 1 : 0;
	}

	if (starsVisible !== data.tourney.manager.bools.starsVisible) {
		starsVisible = data.tourney.manager.bools.starsVisible;
		if (starsVisible) {
			blue_points.style.opacity = 1;
			red_points.style.opacity = 1;

		} else {
			blue_points.style.opacity = 0;
			red_points.style.opacity = 0;
		}
	}

	if (title_ !== `${data.menu.bm.metadata.artist} - ${data.menu.bm.metadata.title} [${data.menu.bm.metadata.difficulty}]`) {
		title_ = `${data.menu.bm.metadata.artist} - ${data.menu.bm.metadata.title} [${data.menu.bm.metadata.difficulty}]`;
		title.innerHTML = title_;
		title_stroke.innerHTML = title_;
	}

	if (mappool && md5 !== data.menu.bm.md5) {
		await delay(200);
		map = mappool ? mappool.beatmaps.find(m => m.beatmap_id == data.menu.bm.id) || { id: data.menu.bm.id, mods: 'NM', identifier: '' } : { mods: 'NM' };
		let mod_ = map.mods || 'NM';
		stats = getModStats(data.menu.bm.stats.CS, data.menu.bm.stats.AR, data.menu.bm.stats.OD, data.menu.bm.stats.BPM.max, mod_);

		cs.innerHTML = stats.cs;
		ar.innerHTML = stats.ar;
		md5 = data.menu.bm.md5;
		sr.innerHTML = `${map?.sr || data.menu.bm.stats.fullSR} <svg id="star" width="30" height="30" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><style>.st0{fill:#FFFFFF;}</style><g> <path class="st0" d="M20.48,2.55l2.46,7.58c0.35,1.07,1.35,1.8,2.48,1.8h7.97c2.52,0,3.57,3.23,1.53,4.71l-6.45,4.69 c-0.91,0.66-1.29,1.84-0.95,2.91l2.46,7.58c0.78,2.4-1.97,4.39-4.01,2.91l-6.45-4.69c-0.91-0.66-2.15-0.66-3.06,0l-6.45,4.69 c-2.04,1.48-4.79-0.51-4.01-2.91l2.46-7.58c0.35-1.07-0.03-2.25-0.95-2.91l-6.45-4.69c-2.04-1.48-0.99-4.71,1.53-4.71h7.97 c1.13,0,2.13-0.73,2.48-1.8l2.46-7.58C16.3,0.15,19.7,0.15,20.48,2.55z"/></g></svg>`;
	}

	if (bestOf !== data.tourney.manager.bestOF) {
		let newmax = Math.ceil(data.tourney.manager.bestOF / 2);
		if (bestOf === undefined) {
			for (let i = 1; i <= newmax; i++) {
				let nodeBlue = document.createElement('div');
				let nodeRed = document.createElement('div');
				nodeBlue.className = 'star-b';
				nodeRed.className = 'star-r';
				nodeBlue.id = `blue${i}`;
				nodeRed.id = `red${i}`;
				document.getElementById('blue-points').appendChild(nodeBlue);
				document.getElementById('red-points').appendChild(nodeRed);
			}

		}
		if (bestOf < data.tourney.manager.bestOF) {
			for (let i = firstTo + 1; i <= newmax; i++) {
				let nodeBlue = document.createElement('div');
				let nodeRed = document.createElement('div');
				nodeBlue.className = 'star-b';
				nodeRed.className = 'star-r';
				nodeBlue.id = `blue${i}`;
				nodeRed.id = `red${i}`;
				document.getElementById('blue-points').appendChild(nodeBlue);
				document.getElementById('red-points').appendChild(nodeRed);
			}
		} else {
			for (let i = firstTo; i > newmax; i--) {
				let nodeBlue = document.getElementById('blue' + i.toString());
				let nodeRed = document.getElementById('red' + i.toString());
				document.getElementById('blue-points').removeChild(nodeBlue);
				document.getElementById('red-points').removeChild(nodeRed);
			}
		}
		bestOf = data.tourney.manager.bestOF;
		firstTo = newmax;
	}

	if (starsRed !== data.tourney.manager.stars.left || starsBlue !== data.tourney.manager.stars.right) {
		starsRed = data.tourney.manager.stars.left;
		starsBlue = data.tourney.manager.stars.right;
		for (let i = 1; i <= firstTo; i++) {
			if (firstTo - i < starsRed) document.getElementById(`red${i}`).style.backgroundColor = 'var(--full-point)';
			else document.getElementById(`red${i}`).style.backgroundColor = 'var(--empty-point)';

			if (firstTo - i < starsBlue) document.getElementById(`blue${i}`).style.backgroundColor = 'var(--full-point)';
			else document.getElementById(`blue${i}`).style.backgroundColor = 'var(--empty-point)';
		}
	}

	if (nameRed !== data.tourney.manager.teamName.left && data.tourney.manager.teamName.left) {
		nameRed = data.tourney.manager.teamName.left || 'Red Team';
		red_name.innerHTML = nameRed;
		red_name_stroke.innerHTML = nameRed;
	}
	if (nameBlue !== data.tourney.manager.teamName.right && data.tourney.manager.teamName.right) {
		nameBlue = data.tourney.manager.teamName.right || 'Blue Team';
		blue_name.innerHTML = nameBlue;
		blue_name_stroke.innerHTML = nameBlue;
	}

	let now = Date.now();

	if (scoreVisible) {
		let scores = [];
		for (let i = 0; i < data.tourney.ipcClients.length; i++) { scores.push({ score: data.tourney.ipcClients[i]?.gameplay?.score, id: i }); }
		scoreRed = scores.filter(s => s.id < data.tourney.ipcClients.length / 2).map(s => s.score).reduce((a, b) => a + b, 0);
		scoreBlue = scores.filter(s => s.id >= data.tourney.ipcClients.length / 2).map(s => s.score).reduce((a, b) => a + b, 0);

		animation.red_score.update(scoreRed);
		animation.red_score_stroke.update(scoreRed);
		animation.blue_score.update(scoreBlue);
		animation.blue_score_stroke.update(scoreBlue);

		if (scoreRed > scoreBlue) {
			red_score.style.fontWeight = '700';
			red_score.style.fontSize = '48px';
			blue_score.style.fontWeight = '500';
			blue_score.style.fontSize = '36px';

			red_score_stroke.style.fontWeight = '700';
			red_score_stroke.style.fontSize = '48px';
			blue_score_stroke.style.fontWeight = '500';
			blue_score_stroke.style.fontSize = '36px';

			if (now - last_score_update > 300) {
				last_score_update = now;
				lead_bar.style.width = 360 * (Math.min(0.5, Math.pow((scoreRed - scoreBlue) / 1000000, 0.7)) * 2) + 'px';
				lead_bar.style.right = '942px';
				lead_bar.style.left = 'unset';
				lead_bar.style.backgroundColor = 'var(--red)';
			}

			if (now - last_girl_update > 1000) {
				last_girl_update = now;
				red_girl.style.transform = 'scale(1.5)';
				blue_girl.style.transform = 'scale(1.0)';
			}
		}
		else if (scoreBlue > scoreRed) {
			blue_score.style.fontWeight = '700';
			blue_score.style.fontSize = '48px';
			red_score.style.fontWeight = '500';
			red_score.style.fontSize = '36px';

			blue_score_stroke.style.fontWeight = '700';
			blue_score_stroke.style.fontSize = '48px';
			red_score_stroke.style.fontWeight = '500';
			red_score_stroke.style.fontSize = '36px';

			if (now - last_score_update > 300) {
				last_score_update = now;
				lead_bar.style.width = 360 * (Math.min(0.5, Math.pow((scoreBlue - scoreRed) / 1000000, 0.7)) * 2) + 'px';
				lead_bar.style.right = 'unset';
				lead_bar.style.left = '942px';
				lead_bar.style.backgroundColor = 'var(--blue)';
			}

			if (now - last_girl_update > 1000) {
				last_girl_update = now;
				red_girl.style.transform = 'scale(1.1)';
				blue_girl.style.transform = 'scale(1.4)';
			}
		}
		else {
			red_score.style.fontWeight = '500';
			red_score.style.fontSize = '36px';
			blue_score.style.fontWeight = '500';
			blue_score.style.fontSize = '36px';

			red_score_stroke.style.fontWeight = '500';
			red_score_stroke.style.fontSize = '36px';
			blue_score_stroke.style.fontWeight = '500';
			blue_score_stroke.style.fontSize = '36px';

			lead_bar.style.width = '20px';

			if (now - last_girl_update > 1000) {
				last_girl_update = now;
				red_girl.style.transform = 'scale(1.25)';
				blue_girl.style.transform = 'scale(1.1)';
			}
		}
	}
}

const getModStats = (cs_raw, ar_raw, od_raw, bpm_raw, mods) => {
	mods = mods.replace('NC', 'DT');
	mods = mods.replace('FM', 'NM');

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

const showGuides = () => {
	let c1 = document.getElementById('client1');
	let c2 = document.getElementById('client2');
	c1.style.opacity = c1.style.opacity == 1 ? 0 : 1;
	c2.style.opacity = c2.style.opacity == 1 ? 0 : 1;
}

const delay = async time => new Promise(resolve => setTimeout(resolve, time));
