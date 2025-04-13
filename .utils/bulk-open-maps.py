import time
import webbrowser


BEATMAP_BASE = "https://osu.ppy.sh/b/"


if __name__ == '__main__':
    while True:
        print("paste map IDs: ")
        map_id = input().strip()

        try:
            map_id = int(map_id)
        except ValueError as e:
            print(f"invalid map ID: {e}")
            continue

        # launch browser at BEATMAP_BASE + str(map_id)
        target = BEATMAP_BASE + str(map_id)
        print(f"opening {target} in browser...")
        webbrowser.open(target)

        time.sleep(0.35)
