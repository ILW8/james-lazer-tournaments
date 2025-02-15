import json

if __name__ == '__main__':
    with open(r"C:\Users\daohe\Downloads\CC24withtransitions_before_QF.json", "r") as infile:
        data = json.load(infile)

    groups = data['groups']

    for group in groups:
        for item in group['settings']['items']:
            if len(item['name']) == 7 and item['name'].endswith('.png'):
                item['show_transition'] = {
                    "id": "fade_transition",
                    "versioned_id": "fade_transition",
                    "name": f"{item['name']} Show Transition",
                    "transition": {},
                    "duration": 300
                }
                item["hide_transition"] = {
                    "id": "fade_transition",
                    "versioned_id": "fade_transition",
                    "name": f"{item['name']} Hide Transition",
                    "transition": {},
                    "duration": 300
                }
    with open(r"C:\Users\daohe\Documents\CC24_with_pickwins - Copy.json", "w") as outfile:
        json.dump(data, outfile, indent=4)
