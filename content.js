// Global variables to store state
let isSelecting = false;
let selectionOverlay = null;
let selectionBox = null;
let startX, startY;
let clickInterval = null;
let selectedArea = null;

// Create and append overlay for area selection
function createOverlay() {
    selectionOverlay = document.createElement('div');
    Object.assign(selectionOverlay.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        cursor: 'crosshair',
        zIndex: '999999'
    });
    
    selectionBox = document.createElement('div');
    Object.assign(selectionBox.style, {
        position: 'fixed',
        border: '2px solid #3498db',
        backgroundColor: 'rgba(52, 152, 219, 0.2)',
        pointerEvents: 'none',
        zIndex: '999999'
    });
    
    document.body.appendChild(selectionOverlay);
    document.body.appendChild(selectionBox);
}

// Handle mouse down event
function handleMouseDown(e) {
    if (!isSelecting) return;
    
    startX = e.clientX;
    startY = e.clientY;
    
    selectionBox.style.left = startX + 'px';
    selectionBox.style.top = startY + 'px';
    selectionBox.style.width = '0';
    selectionBox.style.height = '0';
    selectionBox.style.display = 'block';
    
    selectionOverlay.addEventListener('mousemove', handleMouseMove);
    selectionOverlay.addEventListener('mouseup', handleMouseUp);
}

// Handle mouse move event
function handleMouseMove(e) {
    if (!isSelecting) return;
    
    const currentX = e.clientX;
    const currentY = e.clientY;
    
    const width = currentX - startX;
    const height = currentY - startY;
    
    selectionBox.style.width = Math.abs(width) + 'px';
    selectionBox.style.height = Math.abs(height) + 'px';
    selectionBox.style.left = (width < 0 ? currentX : startX) + 'px';
    selectionBox.style.top = (height < 0 ? currentY : startY) + 'px';
}

// Handle mouse up event
function handleMouseUp(e) {
    if (!isSelecting) return;
    
    const endX = e.clientX;
    const endY = e.clientY;
    
    // Calculate the selection area
    const left = Math.min(startX, endX);
    const top = Math.min(startY, endY);
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);
    
    // Store the selected area
    selectedArea = {
        left: left + window.scrollX,
        top: top + window.scrollY,
        width,
        height
    };
    
    // Clean up
    selectionOverlay.removeEventListener('mousemove', handleMouseMove);
    selectionOverlay.removeEventListener('mouseup', handleMouseUp);
    
    // Remove overlay and selection box
    document.body.removeChild(selectionOverlay);
    document.body.removeChild(selectionBox);
    
    isSelecting = false;
    
    // Send the coordinates back to the popup
    chrome.runtime.sendMessage({
        action: 'areaSelected',
        coordinates: selectedArea
    });
}

// Function to simulate click at specified coordinates
function simulateClick(x, y) {
    const element = document.elementFromPoint(x - window.scrollX, y - window.scrollY);
    if (element) {
        const clickEvent = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true,
            clientX: x - window.scrollX,
            clientY: y - window.scrollY
        });
        element.dispatchEvent(clickEvent);
    }
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case 'startSelection':
            isSelecting = true;
            createOverlay();
            selectionOverlay.addEventListener('mousedown', handleMouseDown);
            break;
            
        case 'startAutoClicker':
            if (!selectedArea || !request.delay) return;
            
            // Calculate center point of selected area
            const centerX = selectedArea.left + (selectedArea.width / 2);
            const centerY = selectedArea.top + (selectedArea.height / 2);
            
            // Start auto clicking
            clickInterval = setInterval(() => {
                simulateClick(centerX, centerY);
            }, request.delay);
            break;
            
        case 'stopAutoClicker':
            if (clickInterval) {
                clearInterval(clickInterval);
                clickInterval = null;
                
                // Show notification in console
                console.log('Auto Clicker: Clicking stopped');
            }
            break;
    }
});

// Cleanup on page unload
window.addEventListener('unload', () => {
    if (clickInterval) {
        clearInterval(clickInterval);
    }
});
