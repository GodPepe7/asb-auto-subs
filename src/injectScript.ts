import { AnimeSite, animeSites } from "./animeSites";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case "alreadyDownloadedInfo":
      createToast("Subs already downloaded once", "#ff9318d3")
      break;
    case "getAnimeMetaData":
      const animeSite: AnimeSite = animeSites.get(message.animeSiteKey)!
      const anilistId = animeSite.getAnilistId()
      const title = animeSite.getTitle()
      const episode = animeSite.getEpisode()
      if (!episode && !anilistId && !title) {
        createToast("Couldn't get anime data", "#a51f07")
        return
      }
      sendResponse({ anilistId, title, episode })
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