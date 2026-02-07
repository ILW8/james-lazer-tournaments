const DEBUG = true;
const cache = {};

let mappool;
(async () => {
  $.ajaxSetup({ cache: false });
  mappool = await $.getJSON('../_data/beatmaps.json');
})();

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

  if (mappool && cache.md5 !== data.beatmap.checksum) {
    cache.md5 = data.beatmap.checksum;
    setTimeout(() => {
      cache.update_stats = true;
    }, 250);
  }

  if (cache.update_stats) {
    cache.update_stats = false;
    cache.mapid = data.beatmap.id;
    const map = mappool
      ? (mappool.beatmaps.find(
          (m) => m.beatmap_id === cache.mapid || m.md5 === cache.md5,
        ) ?? { id: cache.mapid, mods: 'NM', identifier: null })
      : { id: null, mods: 'NM', identifier: null };
    cache.map = map;
    const mods = map?.mods ?? 'NM';
    const stats = getModStats(
      data.beatmap.stats.cs.original,
      data.beatmap.stats.ar.original,
      data.beatmap.stats.od.original,
      data.beatmap.stats.bpm.common,
      mods,
    );

    $('#attrs').text(
      `CS${stats.cs} AR${stats.ar} OD${stats.od} BPM${map?.bpm ?? stats.bpm}`,
    );

    $('#title').text(`${data.beatmap.artist} - ${data.beatmap.title}`);

    const path =
      `http://${location.host}/Songs/${data.folders.beatmap}/${data.files.background}`
        .replace(/#/g, '%23')
        .replace(/%/g, '%25')
        .replace(/\\/g, '/')
        .replace(/'/g, `\\'`);
    $('#beatmap_image').css('background-image', `url('${path}')`);
  }
};

const getModStats = (cs_raw, ar_raw, od_raw, bpm_raw, mods) => {
  mods = mods.replace('NC', 'DT');

  const speed = mods.includes('DT') ? 1.5 : mods.includes('HT') ? 0.75 : 1;

  let ar = mods.includes('HR')
    ? ar_raw * 1.4
    : mods.includes('EZ')
      ? ar_raw * 0.5
      : ar_raw;
  const ar_ms =
    Math.max(
      Math.min(ar <= 5 ? 1800 - 120 * ar : 1200 - 150 * (ar - 5), 1800),
      450,
    ) / speed;
  ar = ar < 5 ? (1800 - ar_ms) / 120 : 5 + (1200 - ar_ms) / 150;

  const cs = mods.includes('HR')
    ? cs_raw * 1.3
    : mods.includes('EZ')
      ? cs_raw * 0.5
      : cs_raw;

  let od = Math.min(
    mods.includes('HR')
      ? od_raw * 1.4
      : mods.includes('EZ')
        ? od_raw * 0.5
        : od_raw,
    10,
  );
  if (speed !== 1)
    od =
      (79.5 -
        Math.min(79.5, Math.max(19.5, 79.5 - Math.ceil(6 * od))) / speed) /
      6;

  return {
    cs: Math.round(cs * 10) / 10,
    ar: Math.round(ar * 10) / 10,
    od: Math.round(od * 10) / 10,
    bpm: Math.round(bpm_raw * speed * 10) / 10,
    speed,
  };
};
