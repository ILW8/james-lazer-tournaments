import fs from "fs";

const pool = {
    NM: [5168187,3851547,5169355,5169367],
    HD: [5169234,4554728],
    HR: [5169231,5169359],
    DT: [5169354,3311356,4781121],
	FM: [5169402,3841983,5169249],
	TB: [5169325]
};

(async () => {
    const ret = {};
    for (const mod of Object.keys(pool)) {
        let idx = 0;

        for (const map of pool[mod]) {
            const res = await fetch(`https://tryz.vercel.app/api/b/${map}`);
            const json = await res.json();

            console.log(`${mod}${idx + 1}`);

            const diff = json.beatmaps.find((beatmap) => beatmap.id === map);

            ret[diff.checksum] = {
                metadata: {
                    artist: json.artist,
                    title: json.title,
                    difficulty: diff.version,
                    mapper: json.creator,
                    id: json.id,
                },
                stats: {
                    CS: diff.cs,
                    AR: diff.ar,
                    OD: diff.accuracy,
                    BPM: {
                        common: diff.bpm,
                    },
                    fullSR: diff.difficulty_rating,
                    length: diff.total_length,
                },
                info: {
                    index: ++idx,
                    mod,
                    isCustom: false,
                },
            };
        }
    }

    fs.writeFileSync("./mappool.json", JSON.stringify(ret));
})();
