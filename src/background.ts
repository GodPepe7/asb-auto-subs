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

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  const hianimePattern = /https:\/\/hianime\.to\/watch\/.+\?ep=.+/;
  if (changeInfo.status === 'complete' && tab.url && hianimePattern.test(tab.url)) {
    console.log("injecting script")
    await chrome.scripting.executeScript({ target: { tabId }, files: ['dist/popup.js'] })
  }
});

async function fetchAnilistId(title: string) {
  console.log("fetching anilist id...")
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
      console.error(`HTTP error! status: ${anilistResponse.status}`)
      return null
    }
    const anilistObject: AnilistObject = await anilistResponse.json()
    console.log("fetched: " + anilistObject.data.Media.id)
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
  console.log("fetching subs...")
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

function markAsDownloaded(filename: string) {

}

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.action === 'getSubs') {
    const anilistId = await fetchAnilistId(message.animeTitle)
    if (!anilistId) return
    const subs = await fetchSubs(anilistId, message.episode)
    if (!subs) {
      return
    }
    chrome.downloads.download({
      url: subs[0].url,
      filename: subs[0].name,
      saveAs: false
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error('Download failed:', chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ success: true, downloadId: downloadId });
      }
    })
  }
})