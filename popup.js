document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const selectAreaBtn = document.getElementById('selectArea');
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const delayInput = document.getElementById('delay');
    const coordinatesBox = document.getElementById('coordinates');
    const statusDiv = document.getElementById('status');
    const xCoord = document.getElementById('xCoord');
    const yCoord = document.getElementById('yCoord');
    const width = document.getElementById('width');
    const height = document.getElementById('height');

    let selectedArea = null;
    let isClicking = false;

    // Function to show status message
    function showStatus(message, isError = false) {
        statusDiv.textContent = message;
        statusDiv.className = 'status-message ' + (isError ? 'error' : 'success');
        setTimeout(() => {
            statusDiv.textContent = '';
            statusDiv.className = 'status-message';
        }, 3000);
    }

    // Function to update UI based on clicking state
    function updateUI(clicking) {
        isClicking = clicking;
        selectAreaBtn.disabled = clicking;
        startBtn.disabled = clicking;
        stopBtn.disabled = !clicking;
        delayInput.disabled = clicking;
    }

    // Handle area selection button click
    selectAreaBtn.addEventListener('click', async () => {
        // Get the active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Send message to content script to start area selection
        chrome.tabs.sendMessage(tab.id, { action: 'startSelection' });
        
        // Update UI
        showStatus('Select an area on the page');
    });

    // Handle start button click
    startBtn.addEventListener('click', async () => {
        if (!selectedArea) {
            showStatus('Please select an area first', true);
            return;
        }

        const delay = parseInt(delayInput.value);
        if (isNaN(delay) || delay < 100) {
            showStatus('Please enter a valid delay (minimum 100ms)', true);
            return;
        }

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Send message to content script to start auto clicking
        chrome.tabs.sendMessage(tab.id, {
            action: 'startAutoClicker',
            delay: delay
        });

        updateUI(true);
        showStatus('Auto clicker started');
    });

    // Handle stop button click
    stopBtn.addEventListener('click', async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Send message to content script to stop auto clicking
        chrome.tabs.sendMessage(tab.id, { action: 'stopAutoClicker' });
        
        updateUI(false);
        showStatus('Auto clicker stopped');
    });

    // Listen for messages from content script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'areaSelected' && request.coordinates) {
            selectedArea = request.coordinates;
            
            // Update coordinates display
            xCoord.textContent = Math.round(selectedArea.left);
            yCoord.textContent = Math.round(selectedArea.top);
            width.textContent = Math.round(selectedArea.width);
            height.textContent = Math.round(selectedArea.height);
            
            // Show coordinates box
            coordinatesBox.classList.remove('hidden');
            
            showStatus('Area selected successfully');
        }
    });

    // Handle delay input validation
    delayInput.addEventListener('input', () => {
        const value = parseInt(delayInput.value);
        if (value < 100) {
            delayInput.value = 100;
        }
    });
});
