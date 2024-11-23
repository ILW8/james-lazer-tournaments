window.addEventListener('contextmenu', (e) => e.preventDefault());

const beatmaps = new Set();
let mappool;
(async () => {
	$.ajaxSetup({ cache: false });
	mappool = await $.getJSON('../_data/beatmaps.json');
})();

let socket = new ReconnectingWebSocket('ws://' + location.host + '/websocket/v2');

socket.onopen = () => { console.log('Successfully Connected'); };
socket.onclose = event => { console.log('Socket Closed Connection: ', event); socket.send('Client Closed!'); };
socket.onerror = error => { console.log('Socket Error: ', error); };

const cache = {};

let selected_maps = [];
let picks = [];
let queue = [];
let map_phases = [];
let current_pick = 1;
let tb_number = -1;

socket.onmessage = async (event) => {
	let data = JSON.parse(event.data);

	if (mappool && !cache.hasSetup) setupBeatmaps();

	if (cache.state !== data.tourney.ipcState) {
		cache.state = data.tourney.ipcState;
		if (cache.state === 3) {
			if (data.beatmap.id === queue[0].id) {
				advanceQueue();
			}
		}
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

		generate_timeline(cache.bestOf);
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
};

const generate_timeline = (bestof) => {
	const parent = $('#timeline');
	parent.html('');

	let map_index = 1;

	let phases = 0;
	if (bestof == 13) {
		phases = 3;
		for (let phase = 1; phase <= phases; phase++) {
			parent.append(create_separator(`PH·${phase}`));
			let bans = phase == 3 ? 0 : 2;
			let picks = 4;
			parent.append(create_phase(map_index, bans, picks, bestof, phase));
			map_index += bans + picks;
		}
	}
	else if (bestof == 11) {
		phases = 3;
		for (let phase = 1; phase <= phases; phase++) {
			parent.append(create_separator(`PH·${phase}`));
			let bans = phase == 3 ? 0 : 2;
			let picks = phase == 3 ? 2 : 4;
			parent.append(create_phase(map_index, bans, picks, bestof, phase));
			map_index += bans + picks;
		}
	}
	else if (bestof == 9) {
		phases = 2;
		for (let phase = 1; phase <= phases; phase++) {
			parent.append(create_separator(`PH·${phase}`));
			let bans = phase == 2 ? 0 : 2;
			let picks = 4;
			parent.append(create_phase(map_index, bans, picks, bestof, phase));
			map_index += bans + picks;
		}
	}
	else if (bestof == 7) {
		phases = 2;
		for (let phase = 1; phase <= phases; phase++) {
			parent.append(create_separator(`PH·${phase}`));
			let bans = phase == 2 ? 0 : 2;
			let picks = phase == 2 ? 2 : 4;
			parent.append(create_phase(map_index, bans, picks, bestof, phase));
			map_index += bans + picks;
		}
	}

	parent.append(create_separator('BAN'));
	final_section = $('<div></div>').addClass('timeline-section');
	final_section_bans = $('<div></div>').addClass('timeline-maps maps-final');

	final_section_bans.append($('<div></div>').addClass(`timeline-map bo${bestof} timeline-block unknown ban`).attr('id', `${map_index}_map`).append(create_text('?', `${map_index}_text`)));
	map_phases.push({ phase: phases + 1, map_index, id: null, type: 'ban', tb: true }); map_index++;

	final_section_bans.append($('<div></div>').addClass(`timeline-map bo${bestof} timeline-block unknown ban`).attr('id', `${map_index}_map`).append(create_text('?', `${map_index}_text`)));
	map_phases.push({ phase: phases + 1, map_index, id: null, type: 'ban', tb: true }); map_index++;

	final_section.append($('<div></div>').addClass('timeline-subsection').append(final_section_bans));

	final_section_bans2 = $('<div></div>').addClass('timeline-maps maps-final');
	final_section_bans2.append($('<div></div>').addClass(`timeline-map bo${bestof} timeline-block play`).append(create_text('PLAY', false)));
	final_section_bans2.append($('<div></div>').addClass(`timeline-map bo${bestof} timeline-block tbpick`).append(create_text('?', 'tb_text')));
	tb_number = map_index;
	final_section.append($('<div></div>').addClass('timeline-subsection').append(final_section_bans2));
	parent.append(final_section);

	map_phases.push({ phase: phases + 1, map_index, id: null, type: 'pick', tb: true });
}

const create_separator = (text) => {
	const parent = $('<div></div>').addClass('timeline-section');
	parent.append($('<div></div>').addClass('timeline-block timeline-separator').append(create_text(text, false)));
	return parent;
}

const create_phase = (map_index, ban_count, pick_count, bestof, phase) => {
	const parent = $('<div></div>').addClass('timeline-section');

	if (ban_count > 0) {
		const bans = $('<div></div>').addClass('timeline-subsection');
		bans.append($('<div></div>').addClass('timeline-title timeline-block timeline-ban').append(create_text('BAN', false)));

		const ban_maps = $('<div></div>').addClass('timeline-maps');
		for (let i = 0; i < ban_count; i++) {
			const map = $('<div></div>').addClass(`timeline-map bo${bestof} timeline-block unknown ban`).attr('id', `${map_index}_map`);
			map.append(create_text('?', `${map_index}_text`));
			map_phases.push({ phase, map_index, id: null, type: 'ban' });
			ban_maps.append(map);
			map_index++;
		}
		bans.append(ban_maps);
		parent.append(bans);
	}

	if (pick_count > 0) {
		const picks = $('<div></div>').addClass('timeline-subsection');
		picks.append($('<div></div>').addClass('timeline-title timeline-block timeline-pick').append(create_text('PICK', false)));

		const pick_maps = $('<div></div>').addClass('timeline-maps');
		for (let i = 0; i < pick_count; i++) {
			const map = $('<div></div>').addClass(`timeline-map bo${bestof} timeline-block unknown pick`).attr('id', `${map_index}_map`);
			map.append(create_text('?', `${map_index}_text`));
			map_phases.push({ phase, map_index, id: null, played: false, type: 'pick' });
			pick_maps.append(map);
			map_index++;
		}
		picks.append(pick_maps);
		parent.append(picks);
	}

	return parent;
}

const create_text = (text, id) => {
	const text_wrapper = $('<div></div>').addClass('timeline-text-wrapper');

	if (id) {
		text_wrapper.append($('<div></div>').addClass('timeline-text stroke').attr('id', `${id}_stroke`).text(text));
		text_wrapper.append($('<div></div>').addClass('timeline-text base-text').attr('id', `${id}`).text(text));
	}
	else {
		text_wrapper.append($('<div></div>').addClass('timeline-text stroke').text(text));
		text_wrapper.append($('<div></div>').addClass('timeline-text base-text').text(text));
	}

	return text_wrapper;
}

class Beatmap {
	constructor(beatmap) {
		this.id = beatmap.beatmap_id;
		this.beatmap = beatmap;
	}
	generate() {
		this.parent = $('<div></div>').addClass('beatmap').attr('id', `map-${this.beatmap.identifier.toLowerCase()}`).css('background-image', `url('https://assets.ppy.sh/beatmaps/${this.beatmap.beatmapset_id}/covers/card.jpg')`);

		const overlay = $('<div></div>').addClass('beatmap-overlay');
		this.light_overlay = $('<div></div>').addClass('beatmap-pick-overlay-light');
		overlay.append(this.light_overlay);

		const stats = $('<div></div>').addClass('beatmap-stats');
		stats.append($('<div></div>').addClass('beatmap-slot').text(this.beatmap.identifier.toUpperCase()));
		stats.append($('<div></div>').addClass('beatmap-title').text(`${this.beatmap.title} [${this.beatmap.difficulty}]`));
		stats.append($('<div></div>').addClass('beatmap-artist').text(this.beatmap.artist));
		overlay.append(stats);
		overlay.append($('<div></div>').addClass('beatmap-stats').append($('<div></div>').addClass('beatmap-mapper').text(this.beatmap.mapper)));

		this.pick_overlay = $('<div></div>').addClass('beatmap-pick-overlay').attr('id', `pick-overlay-${this.beatmap.identifier.toLowerCase()}`);
		this.pick_label = $('<div></div>').addClass('beatmap-picked-label');
		this.pick_label_text = {
			base: $('<div></div>').addClass('beatmap-picked-text base-text').attr('id', `pick-label-${this.beatmap.identifier.toLowerCase()}`),
			stroke: $('<div></div>').addClass('beatmap-picked-text stroke').attr('id', `pick-label-${this.beatmap.identifier.toLowerCase()}-stroke`)
		};
		this.pick_label.append(this.pick_label_text.base).append(this.pick_label_text.stroke);
		this.pick_overlay.append(this.pick_label);

		this.parent.append(overlay);
		this.parent.append(this.pick_overlay);

		$(`#mod-container-${this.beatmap.group}`).append(this.parent);
	}
}

const setupBeatmaps = async () => {
	cache.hasSetup = true;
	const maps = mappool.beatmaps;
	if (!maps || maps.length == 0) return;

	document.cookie = `lastPick=;path=/`;
	$('#mappool_container').html('');
	for (const group of [... new Set(maps.map(b => b.group))]) {
		$('#mappool_container').append($('<div></div>').addClass('mod-container').attr('id', `mod-container-${group}`));
	}

	for (const beatmap of maps) {
		const bm = new Beatmap(beatmap);
		bm.generate();
		bm.parent.on('click', event => {
			if (!event.originalEvent.shiftKey) event.originalEvent.ctrlKey ? banMap(bm, 'red') : pickMap(bm, 'red');
		});
		bm.parent.on('contextmenu', event => {
			if (!event.originalEvent.shiftKey) event.originalEvent.ctrlKey ? banMap(bm, 'blue') : pickMap(bm, 'blue');
		});
		beatmaps.add(bm);
	}
}

const getDataSet = (stored_beatmaps, beatmap_id) => stored_beatmaps.find(b => b.beatmap_id == beatmap_id) || null;

const updateQueue = (map, color, identifier) => {
	if (queue[0]?.phase !== map.phase || queue.length === 0) {
		queue = [];
		$('#queue').html('');
		$('#queue_phase_text').text(`PH. ${map.phase + 1}`);
		$('#queue_phase_text_stroke').text(`PH. ${map.phase + 1}`);
	}
	queue.push(map);
	const map_obj = $('<div></div>').addClass(`queue-item map ${map.tb ? 'tb' : color}`);
	map_obj.append($('<div></div>').addClass('queue-text base-text').text(identifier));
	map_obj.append($('<div></div>').addClass('queue-text stroke').text(identifier));
	$('#queue').append(map_obj);
	if (queue[0]?.tb) $('#queue_phase').css('opacity', '0');
	else $('#queue_phase').css('opacity', '1');
}

const advanceQueue = () => {
	if (queue.length === 0) return;
	$('#queue').find(':first-child')[0].remove();
	queue.shift();
}

const pickMap = (bm, color) => {
	if (selected_maps.includes(bm)) return;
	let i = map_phases.findIndex(e => e.map_index == current_pick);
	if (i === -1 || map_phases[i].type !== 'pick') return console.log('trying to pick on ban phase');
	map_phases[i].id = bm.beatmap.beatmap_id;
	updateQueue(map_phases[i], color, bm.beatmap.identifier);
	selected_maps.push(bm);
	picks.push({ beatmap_id: bm.beatmap.beatmap_id, color });
	localStorage.setItem('picks',  JSON.stringify(picks));

	if (current_pick == tb_number) {
		$('#tb_text').text(bm.beatmap.identifier);
		$('#tb_text_stroke').text(bm.beatmap.identifier);

		bm.pick_label.addClass(`picked tb`).removeClass(`banned red blue`);
		bm.pick_label_text.base.text('TB');
		bm.pick_label_text.stroke.text('TB');
	}
	else {
		$(`#${current_pick}_map`).removeClass('unknown').addClass(color);
		$(`#${current_pick}_text`).text(bm.beatmap.identifier);
		$(`#${current_pick}_text_stroke`).text(bm.beatmap.identifier);

		document.cookie = `lastPick=${bm.id}+${color};path=/`;
		bm.pick_label.addClass(`picked ${color}`).removeClass(`banned ${opposite_team(color)}`);
		bm.pick_label_text.base.text('PICKED');
		bm.pick_label_text.stroke.text('PICKED');
		bm.light_overlay.addClass(color).removeClass(opposite_team(color));
	}

	current_pick++;
}

const banMap = (bm, color) => {
	let i = map_phases.findIndex(e => e.map_index == current_pick);
	if (i === -1 || map_phases[i].type !== 'ban') return console.log('trying to ban on pick phase');

	if (selected_maps.includes(bm) && !map_phases[i].tb) return;
	map_phases[i].id = bm.beatmap.beatmap_id;
	selected_maps.push(bm);

	$(`#${current_pick}_map`).removeClass('unknown red blue tb').addClass(map_phases[i].tb ? 'tb' : color);
	$(`#${current_pick}_text`).text(bm.beatmap.identifier);
	$(`#${current_pick}_text_stroke`).text(bm.beatmap.identifier);

	bm.pick_label.removeClass('picked red blue tb').addClass(`banned ${map_phases[i].tb ? 'tb' : color}`);
	bm.pick_label_text.base.text('BAN');
	bm.pick_label_text.stroke.text('BAN');
	bm.light_overlay.removeClass('red blue').addClass(map_phases[i].tb ? 'tb' : color);
	bm.pick_overlay.removeClass('red blue').addClass(map_phases[i].tb ? 'tb' : color);

	current_pick++;
}

const undoMap = () => {
	if (current_pick <= 1) return;
	current_pick--;
	$(`#${current_pick}_map`).removeClass('red blue').addClass('unknown');
	$(`#${current_pick}_text`).text('?');
	$(`#${current_pick}_text_stroke`).text('?');

	last_map = selected_maps.pop();
	last_map.pick_label.removeClass('picked banned red blue tb');
	last_map.pick_label_text.base.text('');
	last_map.pick_label_text.stroke.text('');
	last_map.light_overlay.removeClass('red blue');
	last_map.pick_overlay.removeClass('red blue');
	queue.pop();
	$('.queue-item.map:last').remove();
}

const switchPick = color => {
	currentPicker = color ? opposite_team(color) : opposite_team(currentPicker);
	$('#current_pick').text(`${currentPicker.toUpperCase()} PICK`).addClass(currentPicker).removeClass(opposite_team(currentPicker));
}
