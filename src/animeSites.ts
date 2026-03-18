export interface AnimeSite {
  isOnEpSite(url: string): boolean;
  getEpisode(): number | null;
  getAnilistId(): number | null;
  getTitle(): string | null;
}

class hianime implements AnimeSite {
  getTitle(): string | null {
    const titleQuery = "h2.film-name > a";
    let title = document.querySelector(titleQuery)?.textContent;
    if (!title) return null;
    return title;
  }
  isOnEpSite(url: string): boolean {
    const epSiteRegEx = new RegExp(/https:\/\/hianimez?\.to\/watch\/.+\?ep=.+/);
    return epSiteRegEx.test(url);
  }
  getEpisode(): number | null {
    const epQuery = ".ssl-item.ep-item.active";
    let episodeString = document.querySelector(epQuery)?.textContent;
    if (!episodeString) return null;
    return parseInt(episodeString);
  }
  getAnilistId(): number | null {
    const syncDataQuery = "#syncData";
    const syncData = document.querySelector(syncDataQuery)?.textContent;
    if (!syncData) return null;
    return parseInt(JSON.parse(syncData).anilist_id);
  }
}

class Miruro implements AnimeSite {
  getTitle(): string | null {
    const titleQuery = ".anime-title > a";
    let title = document.querySelector(titleQuery)?.textContent;
    if (!title) return null;
    return title;
  }
  isOnEpSite(url: string): boolean {
    const epSiteRegEx = new RegExp(
      /https:\/\/(?:www\.)?miruro\.[a-z]+\/watch\/.+(?:\/episode-\d+|\?ep=\d+)/,
    );
    return epSiteRegEx.test(url);
  }
  getEpisode(): number | null {
    const match = window.location.href.match(/(?:\/episode-|\?ep=)(\d+)/);
    if (!match) return null;
    return parseInt(match[1]);
  }
  getAnilistId(): number | null {
    const match = window.location.pathname.match(/\/watch\/(\d+)/);
    if (!match) return null;
    return parseInt(match[1]);
  }
}

export const animeSites = new Map<string, AnimeSite>([
  ["hianime.to", new hianime()],
  ["miruro.tv", new Miruro()],
  ["miruro.online", new Miruro()],
  ["miruro.to", new Miruro()],
]);
