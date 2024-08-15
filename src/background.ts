import { animeSites } from "./animeSites"
import { SiteSpecifics, AnilistIdAndEp, TitleAndEp, JimakuEntry, Subs, AnilistObject, } from "./types"

async function alreadyDownloaded(id: number, episode: number) {
  const key = `${id}_${episode}`
  const result = await chrome.storage.local.get([key])
  console.log(result)
  if (Object.keys(result).length > 0) return true
  await chrome.storage.local.set({ [key]: true })
  return false
}

function getSiteSpecifics(url: string) {
  const baseDomainMatcher = /^(?:https?:\/\/)?(?:www\.)?([^\/:?#]+)/;
  const matches = url.match(baseDomainMatcher);
  if (!matches) {
    return
  }
  const animeSiteBaseDomain = matches[1]
  const siteSpecifics = animeSites.get(animeSiteBaseDomain)
  if (!siteSpecifics) {
    return
  }
  const isOnEpisodePage = siteSpecifics.epPlayerRegEx.test(url)
  if (!isOnEpisodePage) {
    return
  }
  return siteSpecifics
}

async function notifyError(tabId: number, error: string) {
  await chrome.tabs.sendMessage(tabId, { action: 'notifyError', error })
}

async function fetchAnilistId(title: string) {
  const query = `
  query ($title: String) {
    Media (search: $title, type: ANIME) {
      id
    }
  }
  `;
  const url = 'https://graphql.anilist.co'
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      query: query,
      variables: { title: title }
    })
  };
  try {
    const anilistResponse = await fetch(url, options)
    if (!anilistResponse.ok) {
      return
    }
    const anilistObject: AnilistObject = await anilistResponse.json()
    return anilistObject.data.Media.id
  } catch (e) {
    if (typeof e === "string") {
      e.toUpperCase()
    } else if (e instanceof Error) {
      console.error(e.message)
    }
    return
  }
}

async function getAnilistIdAndEpisode(tabId: number, siteSpecifics: SiteSpecifics) {
  let anilistId, episode
  if (siteSpecifics.syncData) {
    const idAndEp: AnilistIdAndEp = await chrome.tabs.sendMessage(tabId, { action: 'getAnilistIdAndEpisode', siteSpecifics })
    console.table(idAndEp)
    if (!idAndEp.anilistId || !idAndEp.episode) {
      return "Failed getting AnilistId and episode"
    }
    anilistId = idAndEp.anilistId
    episode = idAndEp.episode
  } else {
    const titleAndEp: TitleAndEp = await chrome.tabs.sendMessage(tabId, { action: 'getTitleAndEp', siteSpecifics })
    if (!titleAndEp.animeTitle || !titleAndEp.episode) {
      return "Failed getting title and episode"
    }
    const id = await fetchAnilistId(titleAndEp.animeTitle)
    if (!id) {
      return "Failed fetching AnilistId"
    }
    anilistId = id
    episode = titleAndEp.episode
  }
  return { anilistId, episode }
}

async function fetchSubs(anilistId: number, episode: number) {
  const localStorageAPIKey = await chrome.storage.sync.get("apiKey")
  const jimakuAPIKey = localStorageAPIKey["apiKey"]
  const BASE_URL = "https://jimaku.cc/api"
  const jimakuErrors = new Map([
    [400, "Something went wrong! This shouldn't happen"],
    [401, "Authentification failed. Check your API Key"],
    [404, "Entry not found"],
    [429, "You downloaded too many subs in a short amount of time. Try again in a short bit"],
  ])

  try {
    const searchResponse = await fetch(`${BASE_URL}/entries/search?anilist_id=${anilistId}`, {
      method: 'GET',
      headers: {
        'Authorization': `${jimakuAPIKey}`
      }
    })

    if (!searchResponse.ok) {
      const error = jimakuErrors.get(searchResponse.status)
      return error ? error : "Something went wrong"
    }
    const jimakuEntry: JimakuEntry[] = await searchResponse.json()
    if (jimakuEntry.length === 0) {
      return `No subs found for this anime`
    }
    const id = jimakuEntry[0].id

    const filesResponse = await fetch(BASE_URL + `/entries/${id}/files?episode=${episode}`, {
      method: 'GET',
      headers: {
        'Authorization': `${jimakuAPIKey}`
      }
    })
    if (!searchResponse.ok) {
      const error = jimakuErrors.get(searchResponse.status)
      return error ? error : "Something went wrong"
    }
    const subs: Subs[] = await filesResponse.json();
    if (subs.length === 0) {
      return `No subs for episode ${episode} could be found`
    }
    return subs
  } catch (e) {
    if (typeof e === "string") {
      e.toUpperCase()
    } else if (e instanceof Error) {
      console.error(e.message)
    }
    return "There was an error"
  }
}

async function markMultipleAsDownloaded(filename: string, anilistId: number) {
  const rangePattern = /\d+[-~]\d+/;
  const match = filename.match(rangePattern);
  if (!match) return
  const episodeRange = match[0];
  let episodes
  if (episodeRange.includes("-")) {
    episodes = episodeRange.split("-").map(episode => parseInt(episode))
  } else {
    episodes = episodeRange.split("~").map(episode => parseInt(episode))
  }
  for (let i = episodes[0]; i < episodes[1]; i++) {
    const key = `${anilistId}_${i}`
    await chrome.storage.local.set({ [key]: true })
  }
}


async function downloadSubs(anilistId: number, episode: number) {
  const subs = await fetchSubs(anilistId, episode)
  if (typeof subs === "string") {
    return subs;
  }

  const compressedFileEndings = [".zip", ".rar", ".7z"]
  const nonCompressedSub = subs.find(sub => {
    for (let cfe of compressedFileEndings) {
      if (sub.name.endsWith(cfe))
        return false
    }
    return true
  })
  const { url, name } = nonCompressedSub ? nonCompressedSub : subs[0]

  chrome.downloads.download({
    url,
    filename: name,
    saveAs: false
  }, async () => {
    if (chrome.runtime.lastError) {
      return chrome.runtime.lastError.message;
    }
    if (name.endsWith(".zip") || name.endsWith(".rar")) {
      await markMultipleAsDownloaded(name, anilistId);
    }
  })
  return
}

chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  if (details.frameId !== 0) return
  chrome.tabs.get(details.tabId, async (tab) => {
    if (tab.url !== details.url) return
    const siteSpecifics = getSiteSpecifics(tab.url)
    if (!siteSpecifics) return
    await chrome.scripting.insertCSS({ target: { tabId: details.tabId }, files: ["css/index.css"] })
    await chrome.scripting.executeScript({ target: { tabId: details.tabId }, files: ['dist/injectScript.js'] })

    const result = await chrome.storage.sync.get('apiKey')
    if (Object.keys(result).length === 0) {
      notifyError(details.tabId, "Please set your jimaku API Key on https://jimaku.cc/ and set it by clicking the extension icon")
      return
    }

    const idAndEp = await getAnilistIdAndEpisode(details.tabId, siteSpecifics)
    if (typeof idAndEp === "string") {
      notifyError(details.tabId, idAndEp)
      return
    }
    const { anilistId, episode } = idAndEp

    const hasAlreadyBeenDownloaded = await alreadyDownloaded(anilistId, episode)
    if (hasAlreadyBeenDownloaded) {
      chrome.tabs.sendMessage(details.tabId, { action: "alreadyDownloadedInfo" })
      return
    }

    const error = await downloadSubs(anilistId, episode)
    if (error) notifyError(details.tabId, error)
    else chrome.tabs.sendMessage(details.tabId, { action: "notifySuccess" })
  });
});