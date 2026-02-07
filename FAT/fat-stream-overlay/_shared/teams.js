const DEBUG_ = false;

const cache_ = {};

let teams_;
(async () => {
	$.ajaxSetup({ cache: false });
	teams_ = await $.getJSON('../_data/teams.json');
})();

const socket_ = new ReconnectingWebSocket(DEBUG_ ? 'ws://127.0.0.1:24051/' : `ws://${location.host}/websocket/v2`);
socket_.onopen = () => { console.log('Successfully Connected'); };
socket_.onclose = event => { console.log('Socket Closed Connection: ', event); socket_.send('Client Closed!'); };
socket_.onerror = error => { console.log('Socket Error: ', error); };

socket_.onmessage = async event => {
	const data = JSON.parse(event.data);

	if (teams_ && data.tourney.team.left && cache_.nameRed !== data.tourney.team.left) {
		cache_.nameRed = data.tourney.team.left || 'Red Team';
		$('#red_name').text(cache_.nameRed);
		const team = teams_.find(t => t.name === cache_.nameRed);

		$('#red_icon').css('background-image', `url('${team?.icon_url}')`);
    $('#red_quarter').text(team?.quarter ?? '');
	}

	if (teams_ && data.tourney.team.right && cache_.nameBlue !== data.tourney.team.right) {
		cache_.nameBlue = data.tourney.team.right || 'Blue Team';
		$('#blue_name').text(cache_.nameBlue);
		const team = teams_.find(t => t.name === cache_.nameBlue);

		$('#blue_icon').css('background-image', `url('${team?.icon_url}')`);
    $('#blue_quarter').text(team?.quarter ?? '');
	}

	if (cache_.bestOf !== data.tourney.bestOF) {
		const newmax = Math.ceil(data.tourney.bestOF / 2);
		if (cache_.bestOf === undefined) {
			for (let i = 1; i <= newmax; i++) {
				$('#red_points').append($('<div></div>').attr('id', `red${i}`).addClass('team-point'));
				$('#blue_points').append($('<div></div>').attr('id', `blue${i}`).addClass('team-point'));
			}
		}
		else if (cache_.bestOf < data.tourney.bestOF) {
			for (let i = cache_.firstTo + 1; i <= newmax; i++) {
				$('#red_points').append($('<div></div>').attr('id', `red${i}`).addClass('team-point'));
				$('#blue_points').append($('<div></div>').attr('id', `blue${i}`).addClass('team-point'));
			}
		}
		else {
			for (let i = firstTo; i > newmax; i--) {
				$(`#red${i}`).remove();
				$(`#blue${i}`).remove();
			}
		}
		cache_.bestOf = data.tourney.bestOF;
		cache_.firstTo = newmax;
	}

	if (cache_.starsRed !== data.tourney.points.left) {
		cache_.starsRed = data.tourney.points.left;
		for (let i = 1; i <= cache_.starsRed; i++) { $(`#red${i}`).addClass('filled'); }
		for (let i = cache_.starsRed + 1; i <= cache_.firstTo; i++) { $(`#red${i}`).removeClass('filled'); }
	}

	if (cache_.starsBlue !== data.tourney.points.right) {
		cache_.starsBlue = data.tourney.points.right;
		for (let i = 1; i <= cache_.starsBlue; i++) { $(`#blue${i}`).addClass('filled'); }
		for (let i = cache_.starsBlue + 1; i <= cache_.firstTo; i++) { $(`#blue${i}`).removeClass('filled'); }
	}
}
