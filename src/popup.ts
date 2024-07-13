import { SiteSpecifics } from "./types";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case "alreadyDownloadedInfo":
      createToast("Subs already downloaded once", "#ff9318d3")
      break;
    case "getTitleAndEp":
      const siteSpecifics: SiteSpecifics = message.siteSpecifics
      const animeTitle = document.querySelector(siteSpecifics.titleQuery)?.textContent
      const episodeString = document.querySelector(siteSpecifics.epQuery)?.textContent
      if (!animeTitle || !episodeString) return
      const episode = parseInt(episodeString)
      sendResponse({ animeTitle, episode })
      break;
    case "notifyUser":
      if (message.error) {
        createToast(message.error, "#a51f07")
      } else {
        createToast("Successfully downloaded subs", "#0a9611")
      }
      break;
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
    document.removeChild(toast);
  }, 3000);
}