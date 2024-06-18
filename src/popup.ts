
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const animeTitle = document.querySelector("h2.film-name > a")?.textContent
  const episodeElement = document.querySelector(".ssl-item.ep-item.active") as HTMLElement | null
  const episodeString = episodeElement?.dataset.number;
  const toastId = `${animeTitle}_${episodeString}`;

  switch (message.action) {
    case "alreadyDownloadedInfo":
      createToast("Subs already downloaded once", "#ff9318d3", toastId)
      break;
    case "getTitleAndEp":
      if (!animeTitle || !episodeString) return
      const episode = parseInt(episodeString)
      sendResponse({ animeTitle, episode })
      break;
    case "notifyUser":
      if (message.error) {
        createToast(message.error, "#a51f07", toastId)
      } else {
        createToast("Successfully downloaded subs", "#0a9611", toastId)
      }
      break;
  }
});

function createToast(msg: string, color: string, toastId: string) {
  const toast = document.createElement("div");
  toast.id = toastId;
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