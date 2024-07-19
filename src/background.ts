import { animeSites } from "./animeSites"

type Subs = {
  url: string
  name: string
  size: number
  lastModified: string
}

type JimakuEntry = {
  id: number
}

type AnilistObject = {
  data: {
    Media: {
      id: number
    }
  }
}

type TitleAndEp = {
  animeTitle: string
  episode: number
}

async function alreadyDownloaded(title: string, episode: number) {
  const key = `${title}_${episode}`
  const result = await chrome.storage.local.get([key])
  console.log(result)
  if (Object.keys(result).length > 0) return true
  await chrome.storage.local.set({ [key]: true })
  return false
}

function hasOpenedEpisode(url: string) {
  const baseDomainMatcher = /^(?:https?:\/\/)?(?:www\.)?([^\/:?#]+)/;
  const matches = url.match(baseDomainMatcher);
  if (!matches) {
    console.log("matches is null")
    return null
  }
  const animeSiteBaseDomain = matches[1]
  console.log(matches)
  const siteSpecifics = animeSites.get(animeSiteBaseDomain)
  if (!siteSpecifics) {
    console.log("siteSpecifics is null")
    return null
  }
  const isOnEpisodePage = siteSpecifics.epPlayerRegEx.test(url)
  if (!isOnEpisodePage) {
    console.log("isOnEpisodePage is null")
    return null
  }
  return siteSpecifics
}

chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  if (details.frameId !== 0) return
  chrome.tabs.get(details.tabId, async (tab) => {
    console.log("got tab")
    if (tab.url !== details.url) return
    console.log("got exact tab")
    const siteSpecifics = hasOpenedEpisode(tab.url)
    if (siteSpecifics === null) return
    console.log("inserting scripts")
    await chrome.scripting.insertCSS({ target: { tabId: details.tabId }, files: ["css/index.css"] })
    await chrome.scripting.executeScript({ target: { tabId: details.tabId }, files: ['dist/injectScript.js'] })
    const result = await chrome.storage.local.get('apiKey')
    if (Object.keys(result).length === 0) {
      await chrome.tabs.sendMessage(details.tabId, { action: 'notifyUser', error: "Please set your jimaku API Key on https://jimaku.cc/ and set it by clicking the extension icon" })
      return
    }
    console.log("getting title and ep")
    const { animeTitle, episode }: TitleAndEp = await chrome.tabs.sendMessage(details.tabId, { action: 'getTitleAndEp', siteSpecifics })
    console.log("Got: " + animeTitle + " " + episode)
    if (!animeTitle || !episode) {
      console.log("something went wrong getting the title and ep from website")
      return
    }
    console.log("checking if downloaded already")
    const hasAlreadyBeenDownloaded = await alreadyDownloaded(animeTitle, episode)
    if (hasAlreadyBeenDownloaded) {
      console.log("already exists")
      await chrome.tabs.sendMessage(details.tabId, { action: 'alreadyDownloadedInfo' })
      return
    }
    const error = await getSubs(animeTitle, episode)
    console.log("notifying user...")
    await chrome.tabs.sendMessage(details.tabId, { action: 'notifyUser', error })
  });
});

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
      return null
    }
    const anilistObject: AnilistObject = await anilistResponse.json()
    return anilistObject.data.Media.id
  } catch (e) {
    if (typeof e === "string") {
      e.toUpperCase()
    } else if (e instanceof Error) {
      console.error(e.message)
    }
    return null
  }
}


async function fetchSubs(anilistId: number, episode: number) {
  const localStorageAPIKey = await chrome.storage.local.get("apiKey")
  const jimakuAPIKey = localStorageAPIKey["apiKey"]
  const BASE_URL = "https://jimaku.cc/api"
  try {
    const searchResponse = await fetch(`${BASE_URL}/entries/search?anilist_id=${anilistId}`, {
      method: 'GET',
      headers: {
        'Authorization': `${jimakuAPIKey}`
      }
    })
    if (!searchResponse.ok) {
      console.error(`HTTP error! status: ${searchResponse.status}, text: ${searchResponse.statusText}`)
      if (searchResponse.status === 401) return "Authentification failed. Check your API Key"
      else return `You downloaded too many subs in a short amount of time. Try again in ${searchResponse.headers.get("x-ratelimit-reset-after")} seconds`
    }
    const jimakuEntry: JimakuEntry[] = await searchResponse.json()
    if (jimakuEntry.length === 0) {
      console.error(`no entries found for ${anilistId}`)
      return []
    }
    const id = jimakuEntry[0].id
    const filesResponse = await fetch(BASE_URL + `/entries/${id}/files?episode=${episode}`, {
      method: 'GET',
      headers: {
        'Authorization': `${jimakuAPIKey}`
      }
    })
    if (!filesResponse.ok) {
      console.error(`HTTP error! status: ${searchResponse.status}, text: ${searchResponse.statusText}`)
      switch (searchResponse.status) {
        case 400:
          return "Internal error."
        case 401:
          return "Authentification failed. Check your API Key"
        case 429:
          return `You downloaded too many subs in a short amount of time. Try again in ${searchResponse.headers.get("x-ratelimit-reset-after")} seconds`
        default:
          return "`No subs for episode ${episode} could be found.`"
      }
    }
    const subs: Subs[] = await filesResponse.json();
    if (subs.length === 0) {
      console.error(`no entries found for ${anilistId} episode ${episode}`)
      return []
    }
    return subs
  } catch (e) {
    if (typeof e === "string") {
      e.toUpperCase()
    } else if (e instanceof Error) {
      console.error(e.message)
    }
    return []
  }
}

async function markMultipleAsDownloaded(filename: string, title: string) {
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
    const key = `${title}_${i}`
    await chrome.storage.local.set({ [key]: true })
  }
}

async function getSubs(animeTitle: string, episode: number) {
  const anilistId = await fetchAnilistId(animeTitle)
  if (!anilistId) {
    return `Couldn't find anime named "${animeTitle}"`;
  }
  const subs = await fetchSubs(anilistId, episode)
  if (typeof subs === "string") {
    return subs;
  }
  const nonZipSub = subs.find(sub => !sub.name.endsWith(".zip"))
  const { url, name } = nonZipSub ? nonZipSub : subs[0]
  chrome.downloads.download({
    url,
    filename: name,
    saveAs: false
  }, async () => {
    if (chrome.runtime.lastError) {
      return chrome.runtime.lastError.message;
    }
    if (subs[0].name.endsWith(".zip")) {
      await markMultipleAsDownloaded(name, animeTitle);
    }
  })
  return null;
}
