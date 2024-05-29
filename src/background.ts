type Subs = {
  url: string
  name: string
  size: number
  lastModified: string
}

type JimakuEntry = {
  id: number
}

async function alreadyVisited(url: string) {
  const result = await chrome.storage.local.get(url)
  if (Object.keys(result).length > 0) return true
  await chrome.storage.local.set({ [url]: true })
  return false
}

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  const hianimePattern = /https:\/\/hianime\.to\/watch\/.+\?ep=.+/;
  if (changeInfo.status === 'complete' && tab.url && hianimePattern.test(tab.url)) {
    const visited = await alreadyVisited(tab.url)
    if (visited) return
    // Inject content script into the tab
    chrome.scripting.executeScript({ target: { tabId }, files: ['dist/popup.js'] })
  }
});

const JIMAKU = "AAAAAAAAAJ4uAS4uQO_LdGQ5XalZvDYLqb2YuYxn6LBCVW3nx-sFwpBywA"
const BASE_URL = "https://jimaku.cc/api"

async function fetchSubs(title: string, episode: number) {
  try {
    const encodedSearchQuery = encodeURIComponent(title)
    const searchResponse = await fetch(`${BASE_URL}/entries/search?query=${encodedSearchQuery}`, {
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
      console.error(`no entries found for ${title}`)
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
      console.error(`no entries found for ${title} episode ${episode}`)
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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getSubs') {
    (async () => {
      const subs = await fetchSubs(message.animeTitle, message.episode)
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
    })()
  }
})