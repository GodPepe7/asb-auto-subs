let toast = document.querySelector<HTMLElement>("#subs-toast")
if (!toast) {
  toast = document.createElement("div")
  toast.id = "subs-toast"
  document.body.append(toast);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const animeTitle = document.querySelector("h2.film-name > a")?.textContent
  const episodeElement = document.querySelector(".ssl-item.ep-item.active") as HTMLElement | null
  const episodeString = episodeElement?.dataset.number;

  switch (message.action) {
    case "alreadyDownloadedInfo":
      showToast("Subs already downloaded once", "#ff9318d3")
      break;
    case "getTitleAndEp":
      if (!animeTitle || !episodeString) return
      const episode = parseInt(episodeString)
      sendResponse({ animeTitle, episode })
      break;
    case "notifyUser":
      if (message.error) {
        showToast(message.error, "#a51f07")
      } else {
        showToast("Successfully downloaded subs", "#0a9611")
      }
      break;
  }
});

function showToast(msg: string, color: string) {
  toast!.textContent = msg
  toast!.className = "show"
  toast!.style.backgroundColor = color
  setTimeout(() => {
    toast!.className = toast!.className.replace("show", "")
  }, 3000);
}