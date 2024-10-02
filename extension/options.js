document.addEventListener('DOMContentLoaded', () => {
  const receiverPathInput = document.getElementById('receiverPath');
  const destinationInput = document.getElementById('destination');
  const saveButton = document.getElementById('save');
  const statusDiv = document.getElementById('status');

  // Load saved settings
  chrome.storage.sync.get(['receiverPath', 'destination'], (data) => {
    if (data.receiverPath) receiverPathInput.value = data.receiverPath;
    if (data.destination) destinationInput.value = data.destination;
  });

  // Save settings
  saveButton.addEventListener('click', () => {
    const receiverPath = receiverPathInput.value.trim();
    const destination = destinationInput.value.trim();

    chrome.storage.sync.set({ receiverPath, destination }, () => {
      statusDiv.textContent = 'Options saved successfully!';
      setTimeout(() => { statusDiv.textContent = ''; }, 3000);
    });
  });
});
