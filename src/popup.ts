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

document.getElementById('autoDelete')?.addEventListener('change', async function (event) {
  const autoDelete = (event.target as HTMLInputElement).checked;
  await chrome.storage.sync.set({ autoDelete });
})

async function loadSettings() {
  const autoDelete = <boolean>(await chrome.storage.sync.get('autoDelete')).autoDelete;
  const autoDeleteCheckbox = <HTMLInputElement>document.getElementById('autoDelete');
  autoDeleteCheckbox.checked = autoDelete;
}
loadSettings()