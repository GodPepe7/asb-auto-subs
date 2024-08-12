# ASB Auto Subs

A small chrome extension using the jimaku.cc API to automatically download japanese subtitles of the anime episode you are currently watching. Works on hianime.to, animesuge.to and more if needed.
Intended to be used in combination with [ASB Player](https://github.com/killergerbah/asbplayer), another extension, to insert the subtitles into the video

https://github.com/user-attachments/assets/b4f83acc-35f7-41b3-b687-2baa42a84b26

# Instructions

To use the extension you have to do the following steps once:
1. Add the extension to your browser
  - Firefox: get it from the [addon store](https://addons.mozilla.org/en-US/firefox/addon/auto-subs-for-asb-player)
  - Chrome:
    - On [latest releases](https://github.com/GodPepe7/asb-auto-subs/releases) under "Assets" click on "asb-auto-subs-chrome.zip" to download the extension
    - Unzip the downloaded file
    - open "chrome://extensions/", click on "Load Unpacked" and select the unzipped extension
2. Create a [Jimaku Account](https://jimaku.cc/login)  and generate your [API Key](https://jimaku.cc/account)
3. In your searchbar at the top click on the puzzle icon and click on the extension and submit the key
4. Go to any anime episode on hianime or animesuge and it should download the subtitles automatically

# Build locally

Prerequisite: Node 20 LTS installed

1. `npm install`
2. `npm run build`
3. Replace manifest.json content with either firefox-manifest.json or chrome-manifest.json depending on what browser is used
