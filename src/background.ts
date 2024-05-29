type Subs = {
  url: string
  name: string
  size: number
  lastModified: string
}

const JIMAKU = "AAAAAAAAAJ4uAS4uQO_LdGQ5XalZvDYLqb2YuYxn6LBCVW3nx-sFwpBywA"
const BASE_URL = "https://jimaku.cc/api"

async function fetchSubs(id: number, episode: number) {
  try {
    const response = await fetch(BASE_URL + `/entries/${id}/files?episode=${episode}`, {
      method: 'GET',
      headers: {
        'Authorization': `${JIMAKU}`
      }
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
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
    const title = message.episodeTitle
      (async () => {
        const subs = await fetchSubs(715, 1)
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