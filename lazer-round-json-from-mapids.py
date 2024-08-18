import json


def parse_input(user_input: str) -> list[int]:
    ids = []
    parts = user_input.split(",")

    for part in parts:
        try:
            map_id = int(part.strip())
            ids.append(map_id)
        except ValueError:
            print(f"failed to parse {part.strip()} as a map ID, ignoring")
            pass
    return ids


def get_maps() -> list[int]:
    print("paste map IDs, type \"done\" when done")
    maps = []
    while True:
        user_input = input()
        if user_input == "done":
            break
        parsed_ids = parse_input(user_input)
        maps.extend(parsed_ids)
    print(maps)
    return maps


def create_maps_json(maps: list[int]) -> str:
    # todo: take mod and mod count to set Mods property as well
    return json.dumps([{"ID": mapid, "Mods": ""} for mapid in maps])


def get_mods() -> tuple[list[str], list[int]] | None:
    print("please enter a comma-separated list of mod acronyms (e.g. NM, HD, HR, DT, FM, TB)")
    print("please enter a comma-separated list of each mod slot size (e.g. 4, 3, 3, 2, 2, 1)")
    return None


def main():
    maps = get_maps()
    mod_order = get_mods()

    if mod_order is not None:
        mod_acronyms, mod_counts = mod_order

    # todo: mod orders and stuff
    print(create_maps_json(maps))


def mod_bracket_json():
    with open('/Users/daohe/Library/Application Support/osu-development/tournaments/STT4/bracket.json', "r") as f:
        data = json.load(f)
    create_new = False
    print("Pick an option:\n1. Create new round with beatmaps\n2. Replace existing round's beatmaps")
    while True:
        pick = input().strip()
        if pick not in ["1", "2"]:
            print(f"unknown option {pick}, try again")
            continue

        if pick == "1":
            create_new = True
        break
    rounds = data['Rounds']


if __name__ == '__main__':
    main()
    # mod_bracket_json()
