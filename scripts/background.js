// NHS-Link AI Assistant - Background Service Worker
// Currently used for handling installation events or future cross-origin logic if needed.

chrome.runtime.onInstalled.addListener(() => {
  console.log('NHS-Link AI Assistant installed.');
});
