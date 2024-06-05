chrome.identity.getAuthToken({ interactive: true }, function (token) {
  if (chrome.runtime.lastError) {
    console.log('Error fetching token: ', chrome.runtime.lastError);
    return;
  }

  // Store the token using chrome.storage.local
  chrome.storage.local.set({ token: token }, function () {
    console.log('Token stored securely');
  });
});
