const animeTitle = document.querySelector("h2.film-name > a")?.textContent
const episodeElement = document.querySelector(".ssl-item.ep-item.active") as HTMLElement | null
const episode = episodeElement?.dataset.number;

(async () => {
  if (!animeTitle || !episode) return
  const key = `${animeTitle}_${episode}`
  const result = await chrome.storage.local.get([key])
  if (Object.keys(result).length > 0) return
  await chrome.storage.local.set({ [key]: true })
  await chrome.runtime.sendMessage({ action: 'getSubs', animeTitle, episode })
})()
