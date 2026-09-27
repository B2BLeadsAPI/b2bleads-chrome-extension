const input = document.getElementById("api-key")
const status = document.getElementById("status")

chrome.storage.sync.get(["apiKey"], (data) => {
  if (data.apiKey) input.value = data.apiKey
})

document.getElementById("save").addEventListener("click", () => {
  const apiKey = input.value.trim()
  chrome.storage.sync.set({ apiKey }, () => {
    status.textContent = apiKey ? "Saved." : "API key cleared."
    setTimeout(() => { status.textContent = "" }, 2000)
  })
})
