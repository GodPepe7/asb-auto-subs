const animeTitle = document.querySelector("h2.film-name > a")?.textContent
const episodeElement = document.querySelector(".ssl-item.ep-item.active") as HTMLElement | null
const episode = episodeElement?.dataset.number;

let toast = document.querySelector("#subs-toast")
if (!toast) {
  toast = document.createElement("div")
  toast.id = "subs-toast"
  document.body.append(toast);
}

(async () => {
  if (!animeTitle || !episode) return
  const key = `${animeTitle}_${episode}`
  const result = await chrome.storage.local.get([key])
  if (Object.keys(result).length > 0) return
  await chrome.storage.local.set({ [key]: true })
  const response: getSubsResponse = await chrome.runtime.sendMessage({ action: 'getSubs', animeTitle, episode })
  if (!response.success) {
    showErrorToast(response.error)
  } else {
    showSuccessToast()
  }
})()

function showErrorToast(error: string) {
  toast!.textContent = error
  toast!.className = "error show"
  setTimeout(() => {
    toast!.className = toast!.className.replace("error show", "")
  }, 3000);
}

function showSuccessToast() {
  toast!.textContent = "Downloaded Subs successfully"
  toast!.className = "success show"
  setTimeout(() => {
    toast!.className = toast!.className.replace("success show", "")
  }, 3000);
}