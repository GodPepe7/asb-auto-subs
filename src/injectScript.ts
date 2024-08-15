import { SiteSpecifics } from "./types";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case "alreadyDownloadedInfo":
      createToast("Subs already downloaded once", "#ff9318d3")
      break;
    case "getAnilistIdAndEpisode":
      let siteSpecifics: SiteSpecifics = message.siteSpecifics
      let episodeString = document.querySelector(siteSpecifics.epQuery)?.textContent
      const syncData = document.querySelector(siteSpecifics.syncData!)?.textContent
      const anilistId = parseInt(JSON.parse(syncData!).anilist_id)
      if (!anilistId || !episodeString) {
        createToast("Couldn't identify the correct Anilist ID and Episode. (Bug!)", "#a51f07")
        return
      }
      let episode = parseInt(episodeString!)
      sendResponse({ anilistId, episode })
      break;
    case "getTitleAndEp":
      siteSpecifics = message.siteSpecifics
      episodeString = document.querySelector(siteSpecifics.epQuery)?.textContent
      const animeTitle = document.querySelector(siteSpecifics.titleQuery)?.textContent
      if (!animeTitle || !episodeString) {
        createToast("Couldn't identify the correct Anime Title and Episode. (Bug!)", "#a51f07")
        return
      }
      episode = parseInt(episodeString!)
      sendResponse({ animeTitle, episode })
      break;
    case "notifyError":
      createToast(message.error, "#a51f07")
      break;
    case "notifySuccess":
      createToast("Successfully downloaded subs", "#0a9611")
  }
});

function createToast(msg: string, color: string) {
  const toast = document.createElement("div");
  toast.className = "subs-toast"
  toast.textContent = msg
  toast.style.backgroundColor = color
  toast.className += " show"
  document.body.append(toast);
  setTimeout(() => {
    toast.className = toast.className.replace("show", "")
    toast.remove();
  }, 3000);
}