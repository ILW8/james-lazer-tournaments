const socket = new ReconnectingWebSocket(
  "ws://" + location.host + "/websocket/v2"
);

let mappool;
(async () => {
  $.ajaxSetup({ cache: false });
  let stage = await $.getJSON("../_data/beatmaps.json");
  mappool = stage.beatmaps;
  if (mappool) $("#stage_name").html(`${stage.stage}`);
  else $("#stage_name").html("Unknown Round");
})();

socket.onopen = () => {
  console.log("Successfully Connected");
};
socket.onclose = (event) => {
  console.log("Socket Closed Connection: ", event);
  socket.send("Client Closed!");
};
socket.onerror = (error) => {
  console.log("Socket Error: ", error);
};

const cache = {};
let update_stats = false;

socket.onmessage = async (event) => {
  let data = JSON.parse(event.data);

  if (mappool && cache.md5 !== data.beatmap.checksum) {
    cache.md5 = data.beatmap.checksum;
    await delay(200);
    update_stats = true;
  }

  if (update_stats) {
    update_stats = false;
    const map = mappool.find(
      (m) =>
        m.beatmap_id === data.beatmap.id ||
        m.md5 === cache.md5 ||
        (m.artist === data.beatmap.artistUnicode &&
          m.title === data.beatmap.titleUnicode &&
          m.difficulty === data.beatmap.version)
    );
    $("#now_playing").html(map?.identifier ?? "XX");

    document.querySelector(".customIndicator").style.display = map?.custom
      ? ""
      : "none";

    const mod_ = map?.mods || "NM";
    const stats = getModStats(
      data.beatmap.stats.cs.original,
      data.beatmap.stats.ar.original,
      data.beatmap.stats.od.original,
      0,
      mod_
    );

    $("#bpm").html(
      Math.round((map?.bpm || data.beatmap.stats.bpm.common) * 10) / 10
    );
    $("#cs").html(
      Math.round(
        (mod_ == "FM"
          ? data.beatmap.stats.cs.original
          : map
          ? stats.cs
          : data.beatmap.stats.cs.converted) * 10
      ) / 10
    );
    $("#ar").html(
      Math.round(
        (mod_ == "FM"
          ? data.beatmap.stats.ar.original
          : map
          ? stats.ar
          : data.beatmap.stats.ar.converted) * 10
      ) / 10
    );
    $("#od").html(
      Math.round(
        (mod_ == "FM"
          ? data.beatmap.stats.od.original
          : map
          ? stats.od
          : data.beatmap.stats.od.converted) * 10
      ) / 10
    );
    $("#sr").html((map?.sr || data.beatmap.stats.stars.total).toFixed(2) + "★");

    let length_modifier = map
      ? mod_?.includes("DT")
        ? 1.5
        : 1
      : data.resultsScreen.mods.name.includes("DT") ||
        data.play.mods.name.includes("DT")
      ? 1.5
      : 1;
    len_ = data.beatmap.time.lastObject - data.beatmap.time.firstObject;
    let mins = Math.trunc(len_ / length_modifier / 1000 / 60);
    let secs = Math.trunc((len_ / length_modifier / 1000) % 60);
    $("#length").html(`${mins}:${secs.toString().padStart(2, "0")}`);

    const path =
      `http://${location.host}/Songs/${data.folders.beatmap}/${data.files.background}`
        .replace(/#/g, "%23")
        .replace(/%/g, "%25")
        .replace(/\\/g, "/");
    console.log(path);
    $("#map_stats_background").css("background-image", `url('${path}')`);
    $("#map_background").css("background-image", `url('${path}')`);
  }

  if (
    cache.replayer !== data.resultsScreen.name ||
    cache.replayer !== data.play.playerName
  ) {
    cache.replayer = data.resultsScreen.name ?? data.play.playerName;
    $("#replayer").html(cache.replayer ?? "Unknown");
  }

  if (cache.artist !== data.beatmap.artist) {
    cache.artist = data.beatmap.artist;
    $("#artist").text(cache.artist);
  }
  if (cache.title !== data.beatmap.title) {
    cache.title = data.beatmap.title;
    $("#title").text(cache.title);
  }
  if (cache.difficulty !== data.beatmap.version) {
    cache.difficulty = data.beatmap.version;
    $("#difficulty").text(cache.difficulty);
  }
  if (cache.mapper !== data.beatmap.mapper) {
    cache.mapper = data.beatmap.mapper;
    $("#mapper").text(cache.mapper);
  }
};

const getModStats = (cs_raw, ar_raw, od_raw, hp_raw, mods) => {
  let speed = mods.includes("DT") ? 1.5 : mods.includes("HT") ? 0.75 : 1;
  let ar = mods.includes("HR")
    ? ar_raw * 1.4
    : mods.includes("EZ")
    ? ar_raw * 0.5
    : ar_raw;
  let ar_ms =
    Math.max(
      Math.min(ar <= 5 ? 1800 - 120 * ar : 1200 - 150 * (ar - 5), 1800),
      450
    ) / speed;
  ar = ar_ms > 1200 ? (1800 - ar_ms) / 120 : 5 + (1200 - ar_ms) / 150;

  let cs = Math.min(
    mods.includes("HR")
      ? cs_raw * 1.3
      : mods.includes("EZ")
      ? cs_raw * 0.5
      : cs_raw,
    10
  );
  let hp = Math.min(
    mods.includes("HR")
      ? hp_raw * 1.4
      : mods.includes("EZ")
      ? hp_raw * 0.5
      : hp_raw,
    10
  );

  let od = mods.includes("HR")
    ? Math.min(od_raw * 1.4, 10)
    : mods.includes("EZ")
    ? od_raw * 0.5
    : od_raw;
  od = Math.min(
    (79.5 - Math.min(79.5, Math.max(19.5, 79.5 - Math.ceil(6 * od))) / speed) /
      6,
    speed > 1.5 ? 12 : 11
  );

  return { cs, ar, od, hp, ar_ms };
};
