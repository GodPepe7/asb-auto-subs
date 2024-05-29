const animeTitle = document.querySelector("h2.film-name > a")?.textContent
const episodeElement = document.querySelector(".ssl-item.ep-item.active") as HTMLElement | null
const episode = episodeElement?.dataset.number;
chrome.runtime.sendMessage({ action: 'getSubs', animeTitle, episode })