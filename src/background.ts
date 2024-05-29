type Subs = {
  url: string
  name: string
  size: number
  lastModified: string
}

type JimakuEntry = {
  id: number
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  const hianimePattern = /https:\/\/hianime\.to\/watch\/.+\?ep=.+/;
  if (changeInfo.status === 'complete' && tab.url && hianimePattern.test(tab.url)) {
    console.log("visited hianime")
    // Inject content script into the tab
    chrome.scripting.executeScript({ target: { tabId }, files: ['dist/popup.js'] })
      .then(() => console.log("injected script file"));
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
    if (!jimakuEntry) {
      console.error(`no entries found for ${title}`)
      return null
    }
    const id = jimakuEntry[0].id
    const response = await fetch(BASE_URL + `/entries/${id}/files?episode=${episode}`, {
      method: 'GET',
      headers: {
        'Authorization': `${JIMAKU}`
      }
    })
    if (!response.ok) {
      console.error(`HTTP error! status: ${searchResponse.status}`)
      return null
    }
    const data: Subs[] = await response.json();
    return data
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
        sendResponse({ success: false, error: "fetching error" });
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
          console.log('Download started:', downloadId);
          sendResponse({ success: true, downloadId: downloadId });
        }
      })
    })()
  }
})