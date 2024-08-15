document.getElementById('apiKeyForm')?.addEventListener('submit', async function (event) {
  event.preventDefault();
  const inputAPIKey = (document.getElementById('apiKey') as HTMLInputElement).value;
  await chrome.storage.sync.set({ apiKey: inputAPIKey });
  setApiKeyInfo()
});

async function setApiKeyInfo() {
  const storageItem = await chrome.storage.sync.get('apiKey');
  if (Object.keys(storageItem).length === 0) return;
  (document.getElementById('apiKey') as HTMLInputElement)!.value = storageItem['apiKey'];
  const keyInfo = document.querySelector('.key-info');
  keyInfo!.textContent = 'API Key set!';
  keyInfo!.classList.add("set");
}
setApiKeyInfo();