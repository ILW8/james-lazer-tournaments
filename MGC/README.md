# MGC Stream Setup

Welcome to MGC stream setup! We are using a gosumemory-based tournament client overlay with some custom OBS magic to make everything come together. Please read this fully to make sure your setup is as smooth as possible. If you have questions during setup, please contact me on discord @diosdong.

## The Tournament Client

Make sure you have the tournament client downloaded and ready to go in a separate folder. Extract `User.osk` and `tournament.cfg` into that folder. Your tournament client should now be good to go.

## Third-Party Apps

We use two third-party apps outside of gosumemory to create a better stream. The first is `Snaz`, which is a timer app. The second is `Snip`, which extracts now playing information from spotify and displays it on-screen.

### Snaz

Snaz installation should be relatively simple. Just run the setup .exe file in the third-party apps folder, and everything should be installed. Once it's installed, you'll want these settings:

![snaz settings](https://i.imgur.com/mSMHqr6.png)

We specifically use the `Countdown to specific time` section of snaz for the starting soon page.

### Snip

Snip comes in a zip file rather than in a setup .exe file. You can just as easily extract Snip and all its relevant files to a folder anywhere on your PC. I keep mine on my desktop for easy access. Once it's extracted, run Snip and link your spotify account. If you don't have a spotify or iTunes account, you'll need to figure out a different solution for the starting soon screen now playing area.

After connecting snip, there should be a snip icon on your desktop tray. Right click it, and select "Set Output Format." It should look like this:

![Snip output format selection](https://i.imgur.com/cGjF7Dy.png)

![Snip output format](https://i.imgur.com/r5GvwMx.png)

Make sure your output format matches what is listed here. Make sure you also extract `Round_masking.png` into your Snip folder. We'll use that in OBS to round the corners of the album covers fetched by Snip.

## Gosumemory

Most of the work should already be done for you here, but there are a few things you need to do to make this work. First and foremost is setting your API key. Go to `.\static\mgc-tournament-client\api.json` and put your osu! API v1 key between the empty quotes. You can find your API v1 key on your [osu! profile's settings page](https://osu.ppy.sh/home/account/edit) under `Legacy API`.

### Operation

`tl;dr` Everything in this client must be done **manually**.

In the osu! Lazer tournament client, initial bans and the initial pick must be done manually on the mappool scene, but after that, every subsequent pick is done automatically. That is not the case here. Every pick must be manually selected by the streamer.

To interact with the mappool scene, click on the `mappool overlay` source in OBS, and then click `Interact`. This should pop open a separate window with just the `mappool overlay` source. It's from here that you will handle all picks and bans.

To pick a map, either left click or right click on a map. Left click picks the map for the left player, right click for the right player. To ban a map, hold `shift` and either left click or right click on a map. Again, left click for left player, right for right player. To reset a map to neither picked nor banned, hold `control` and click on a map; left and right click do not matter in this case.

During the match, the scores on each map will **not reset** until the next map starts. At the end of each map, once the results screen goes away, simply switch to the mappool scene instead of staying on the gameplay scene.

You should not have to worry about setting gosu up in OBS; that's already taken care of in the OBS json file.

## OBS

There is a premade OBS json file included in the OBS GFX folder of the stream pack. Open OBS Studio; on the top bar, click `Scene Collection` and then `Import`.

![import scene collection obs](https://i.imgur.com/zJQYXQ7.png)

This should prompt you to provide a scene collection json file, from which OBS will attempt to recreate that entire scene collection on your PC. Once you have loaded the `MGC.json` file into OBS, you will need to connect any missing files to their locations on your PC, since they were set to their locations on my PC to start. Everything else *should* be already in its place in OBS.