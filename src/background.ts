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

type getSubsResponse = {
  success: boolean
  error: string
}

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  const hianimePattern = /https:\/\/hianime\.to\/watch\/.+\?ep=.+/;
  if (changeInfo.status === 'complete' && tab.url && hianimePattern.test(tab.url)) {
    await chrome.scripting.insertCSS({ target: { tabId }, files: ["css/index.css"] })
    await chrome.scripting.executeScript({ target: { tabId }, files: ['dist/popup.js'] })
  }
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
  const JIMAKU = "AAAAAAAAAJ4uAS4uQO_LdGQ5XalZvDYLqb2YuYxn6LBCVW3nx-sFwpBywA"
  const BASE_URL = "https://jimaku.cc/api"
  try {
    const searchResponse = await fetch(`${BASE_URL}/entries/search?anilist_id=${anilistId}`, {
      method: 'GET',
      headers: {
        'Authorization': `${JIMAKU}`
      }
    })
    if (!searchResponse.ok) {
      console.error(`HTTP error! status: ${searchResponse.status}`)
      return null
    }
    const jimakuEntry: JimakuEntry[] = await searchResponse.json()
    if (jimakuEntry.length === 0) {
      console.error(`no entries found for ${anilistId}`)
      return null
    }
    const id = jimakuEntry[0].id
    const filesResponse = await fetch(BASE_URL + `/entries/${id}/files?episode=${episode}`, {
      method: 'GET',
      headers: {
        'Authorization': `${JIMAKU}`
      }
    })
    if (!filesResponse.ok) {
      console.error(`HTTP error! status: ${filesResponse.status}`)
      return null
    }
    const subs: Subs[] = await filesResponse.json();
    if (subs.length === 0) {
      console.error(`no entries found for ${anilistId} episode ${episode}`)
      return null
    }
    return subs
  } catch (e) {
    if (typeof e === "string") {
      e.toUpperCase()
    } else if (e instanceof Error) {
      console.error(e.message)
    }
    return null
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

async function getSubsHandler(animeTitle: string, episode: number) {
  const anilistId = await fetchAnilistId(animeTitle)
  if (!anilistId) {
    return { success: false, error: `Couldn't find anime named "${animeTitle}"` };
  }
  const subs = await fetchSubs(anilistId, episode)
  if (!subs) {
    return { success: false, error: `No subs found for ${animeTitle} Episode ${episode}` }
  }
  const { url, name } = subs[0]
  chrome.downloads.download({
    url,
    filename: name,
    saveAs: false
  }, async (downloadId) => {
    if (chrome.runtime.lastError) {
      return { success: false, error: chrome.runtime.lastError.message };
    }
    if (subs[0].name.endsWith(".zip")) {
      await markMultipleAsDownloaded(name, animeTitle);
    }
  })
  return { success: true, error: null };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getSubs') {
    const { animeTitle, episode } = message
    getSubsHandler(animeTitle, episode).then(response => sendResponse(response))
    return true
  }
})