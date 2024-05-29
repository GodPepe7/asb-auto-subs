chrome.runtime.sendMessage({ action: 'getSubs', episodeTitle: 'Frieren' }).then(message => {
  console.log(message)
})