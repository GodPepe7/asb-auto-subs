export interface AnimeSite {
  isOnEpSite(url: string): boolean
  getEpisode(): number | null
  getAnilistId(): number | null
  getTitle(): string | null
}

class HiAnime implements AnimeSite {
  getTitle(): string | null {
    const titleQuery = "h2.film-name > a"
    let title = document.querySelector(titleQuery)?.textContent
    if (!title) return null
    return title
  }
  isOnEpSite(url: string): boolean {
    const epSiteRegEx = new RegExp(/https:\/\/hianime\.to\/watch\/.+\?ep=.+/)
    return epSiteRegEx.test(url)
  }
  getEpisode(): number | null {
    const epQuery = ".ssl-item.ep-item.active"
    let episodeString = document.querySelector(epQuery)?.textContent
    if (!episodeString) return null
    return parseInt(episodeString)
  }
  getAnilistId(): number | null {
    const syncDataQuery = "#syncData"
    const syncData = document.querySelector(syncDataQuery)?.textContent
    if (!syncData) return null
    return parseInt(JSON.parse(syncData).anilist_id)
  }
}

class Miruro implements AnimeSite {
  getTitle(): string | null {
    const titleQuery = ".anime-title > a"
    let title = document.querySelector(titleQuery)?.textContent
    if (!title) return null
    return title
  }
  isOnEpSite(url: string): boolean {
    const epSiteRegEx = new RegExp(/https:\/\/www\.miruro\.tv\/watch\?id=.+ep=.+/)
    return epSiteRegEx.test(url)
  }
  getEpisode(): number | null {
    const urlParams = new URLSearchParams(window.location.search);
    const episodeString = urlParams.get('ep');
    if (!episodeString) return null
    return parseInt(episodeString)
  }
  getAnilistId(): number | null {
    const urlParams = new URLSearchParams(window.location.search);
    const anilistIdString = urlParams.get('id');
    if (!anilistIdString) return null
    return parseInt(anilistIdString)
  }
}

export const animeSites = new Map<string, AnimeSite>([
  ["hianime.to", new HiAnime()],
  ["miruro.tv", new Miruro()],
])