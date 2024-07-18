console.log("popup.js getting executed")
console.log(document.body.innerHTML)

document.getElementById('apiKeyForm')?.addEventListener('submit', async function (event) {
  console.log("test")
  event.preventDefault(); // Prevent the default form submission
  const inputAPIKey = (document.getElementById('apiKey') as HTMLInputElement).value;
  console.log(`Set API Key: ${inputAPIKey}`)
  await chrome.storage.local.set({ apiKey: inputAPIKey })
  const result = await chrome.storage.local.get('apiKey')
  console.log(result["apiKey"])
});