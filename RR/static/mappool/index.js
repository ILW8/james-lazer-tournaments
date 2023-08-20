let mappool;
(async () => {
	$.ajaxSetup({ cache: false });
	mappool = await $.getJSON('../_data/beatmaps.json');
})();

let socket = new ReconnectingWebSocket('ws://' + location.host + '/ws');

let title = document.getElementById('song-title');
let title_stroke = document.getElementById('song-title-stroke');

let red_name = document.getElementById('red-name');
let red_name_stroke = document.getElementById('red-name-stroke');
let blue_name = document.getElementById('blue-name');
let blue_name_stroke = document.getElementById('blue-name-stroke');

let red_points = document.getElementById('red-points');
let blue_points = document.getElementById('blue-points');

let red_girl = document.getElementById('animegirl-red');
let blue_girl = document.getElementById('animegirl-blue');

socket.onopen = () => { console.log('Successfully Connected'); };

socket.onclose = event => {
	console.log('Socket Closed Connection: ', event);
	socket.send('Client Closed!');
};

socket.onerror = error => { console.log('Socket Error: ', error); };

let beatmaps = new Set();
let hasSetup = false;

let title_, md5;
let bestOf, firstTo;
let scoreVisible, starsVisible;
let starsRed, nameRed;
let starsBlue, nameBlue;

let map, mapid;

class Beatmap {
	constructor(mods, modID, beatmapID, layerName) {
		this.mods = mods;
		this.modID = modID;
		this.beatmapID = beatmapID;
		this.layerName = layerName;
	}
	generate() {
		let mappoolContainer = document.getElementById(`${this.mods}`);

		this.clicker = document.createElement('div');
		this.clicker.id = `${this.layerName}Clicker`;

		mappoolContainer.appendChild(this.clicker);
		let clickerObj = document.getElementById(this.clicker.id);

		this.map = document.createElement('div');
		this.map.id = `${this.layerName}BG`;
		this.map.setAttribute('class', 'map');

		this.artist = document.createElement('div');
		this.artist.id = `${this.layerName}ARTIST`;
		this.artist.setAttribute('class', 'mapArtist');

		this.title = document.createElement('div');
		this.title.id = `${this.layerName}TITLE`;
		this.title.setAttribute('class', 'mapTitle');

		this.mapper = document.createElement('div');
		this.mapper.id = `${this.layerName}MAPPER`;
		this.mapper.setAttribute('class', 'mapMapper');

		this.pickedStatus = document.createElement('div');
		this.pickedStatus.id = `${this.layerName}STATUS`;
		this.pickedStatus.setAttribute('class', 'pickingStatus');

		this.pickedStatusText = document.createElement('div');
		this.pickedStatusText.id = `${this.layerName}STATUSTEXT`;
		this.pickedStatusText.setAttribute('class', 'pickingStatusText');

		this.modIcon = document.createElement('div');
		this.modIcon.id = `${this.layerName}MODICON`;
		this.modIcon.setAttribute('class', 'modIcon');
		this.modIcon.innerHTML = `${this.modID}`;

		this.clicker.setAttribute('class', 'clicker');
		clickerObj.appendChild(this.map);
		let mapObj = document.getElementById(this.map.id);
		mapObj.appendChild(this.modIcon);
		mapObj.appendChild(this.title);
		mapObj.appendChild(this.artist);
		mapObj.appendChild(this.mapper);
		mapObj.appendChild(this.pickedStatus);
		mapObj.appendChild(this.pickedStatusText);
	}
}

async function setupBeatmaps() {
	hasSetup = true;

	let bms = [];
	$.ajaxSetup({ cache: false });
	const jsonData = await $.getJSON(`../_data/beatmaps.json`);
	jsonData.beatmaps.map((beatmap) => { bms.push(beatmap); });

	bms.map(async (beatmap, index) => {
		const bm = new Beatmap(beatmap.mods, beatmap.identifier, beatmap.beatmap_id, `map${index}`);
		bm.generate();
		bm.clicker.addEventListener('mousedown', () => {
			bm.clicker.addEventListener('click', event => {
				if (!event.shiftKey) event.ctrlKey ? banMap(bm, 'red') : pickMap(bm, 'red');
				else resetMap(bm);
			});
			bm.clicker.addEventListener('contextmenu', event => {
				if (!event.shiftKey) event.ctrlKey ? banMap(bm, 'blue') : pickMap(bm, 'blue');
				else resetMap(bm);
			});
		});
		bm.clicker.style.backgroundImage = `url('https://assets.ppy.sh/beatmaps/${beatmap.beatmapset_id}/covers/cover.jpg')`;
		bm.artist.innerHTML = `${beatmap.artist}`;
		bm.title.innerHTML = `${beatmap.title}`;
		bm.mapper.innerHTML = `${beatmap.mapper}`;
		beatmaps.add(bm);
	});
}

const pickMap = (bm, color) => {
	document.cookie = `lastPick=${bm.beatmapID}-${color.toLowerCase()};path=/`;

	bm.clicker.style.outline = bm.mods.includes('TB') ? '3px solid #ffffff' : color == 'red' ? '3px solid var(--red)' : '3px solid var(--blue)';
	bm.pickedStatus.style.backgroundColor = 'rgba(0, 0, 0, 0)';
	bm.pickedStatus.style.opacity = 1;
	bm.pickedStatus.innerHTML = bm.mods.includes('TB') ? '' : `<b class="pick${color}">PICK</b>`;
	bm.pickedStatusText.style.opacity = 1;
	bm.pickedStatusText.innerHTML = bm.mods.includes('TB') ? '' : `<b class="pick${color}">PICK</b>`;
}

const banMap = (bm, color) => {
	if (bm.mods.includes('TB')) return;

	bm.pickedStatus.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
	bm.clicker.style.outline = color == 'red' ? '3px solid var(--red-dark)' : '3px solid var(--blue-dark)';
	bm.pickedStatus.style.opacity = 1;
	bm.pickedStatus.innerHTML = `<b class="ban${color}">BAN</b>`;
	bm.pickedStatusText.style.opacity = 1;
	bm.pickedStatusText.innerHTML = `<b class="ban${color}">BAN</b>`;
}

const resetMap = bm => {
	document.cookie = `lastPick=;path=/`;

	bm.pickedStatus.style.backgroundColor = 'rgba(0, 0, 0, 0)';
	bm.clicker.style.outline = 'none';
	bm.pickedStatus.style.opacity = 0;
	bm.pickedStatus.innerHTML = '';
	bm.pickedStatusText.style.opacity = 0;
	bm.pickedStatusText.innerHTML = '';
}

socket.onmessage = async event => {
	let data = JSON.parse(event.data);

	if (!hasSetup) setupBeatmaps();

	if (scoreVisible !== data.tourney.manager.bools.scoreVisible) { scoreVisible = data.tourney.manager.bools.scoreVisible; }

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
		animation.blue_score.update(scoreBlue);

		if (scoreRed > scoreBlue) {
			red_score.style.fontWeight = '700';
			red_score.style.fontSize = '48px';
			blue_score.style.fontWeight = '500';
			blue_score.style.fontSize = '36px';

			if (now - last_score_update > 300) {
				last_score_update = now;
				lead_bar.style.width = 360 * (Math.min(0.5, Math.pow((scoreRed - scoreBlue) / 1000000, 0.7)) * 2) + 'px';
				lead_bar.style.right = '942px';
				lead_bar.style.left = 'unset';
				lead_bar.style.backgroundColor = 'var(--red)';

				red_girl.style.transform = 'scale(1.5)';
				blue_girl.style.transform = 'scale(1.0)';
			}
		}
		else if (scoreBlue > scoreRed) {
			blue_score.style.fontWeight = '700';
			blue_score.style.fontSize = '48px';
			red_score.style.fontWeight = '500';
			red_score.style.fontSize = '36px';

			if (now - last_score_update > 300) {
				last_score_update = now;
				lead_bar.style.width = 360 * (Math.min(0.5, Math.pow((scoreBlue - scoreRed) / 1000000, 0.7)) * 2) + 'px';
				lead_bar.style.right = 'unset';
				lead_bar.style.left = '942px';
				lead_bar.style.backgroundColor = 'var(--blue)';

				red_girl.style.transform = 'scale(1.1)';
				blue_girl.style.transform = 'scale(1.4)';
			}
		}
		else {
			red_score.style.fontWeight = '500';
			red_score.style.fontSize = '36px';
			blue_score.style.fontWeight = '500';
			blue_score.style.fontSize = '36px';

			lead_bar.style.width = '20px';

			red_girl.style.transform = 'scale(1.25)';
			blue_girl.style.transform = 'scale(1.1)';
		}
	}
}

const getModStats = (cs_raw, ar_raw, od_raw, bpm_raw, mods) => {
	mods = mods.replace('NC', 'DT');
	mods = mods.replace('FM', 'HR');

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
