# ASB Auto Subs

A small chrome extension using the jimaku.cc API to automatically download japanese subtitles of the anime episode you are currently watching. Works on hianime.to, animesuge.to and more if needed.

# Instructions

To use the extension you have to do the following steps once:

1. On [latest releases](https://github.com/GodPepe7/asb-auto-subs/releases) under "Assets" click on "asb-auto-subs.zip" to download the extension
2. Unzip the downloaded file
3. Add the extension to your browser
- **Google Chrome**: open "chrome://extensions/", click on "Load Unpacked" and select the unzipped extension
- **Firefox**: open "about:addons", click on the settings wheel at the top and select the "manifest.json" in the unzipped extension
4. Create a [Jimaku Account](https://jimaku.cc/login)  and generate your [API Key](https://jimaku.cc/account)
5. In your searchbar at the top click on the puzzle icon and click on the extension and submit the key

# Build locally

Prerequisite: Node 20 LTS installed

1. `npm install`
2. `npm run build`
3. Replace manifest.json content with either firefox-manifest.json or chrome-manifest.json depending on what browser is used

# To Do

- [x] Notify user when no subs there (Or just add some UI/UX lol)
- [ ] Add support for files in zip
- [x] Add support for other sites
- [ ] Insert subs directly into ASB Player?