// content_code_toggler.js
console.log('Content script loaded');

// Function to toggle the visibility of the <code> element
function toggleCodeVisibility(preElement) {
    const codeElement = preElement.querySelector('code');
    if (codeElement) {
        codeElement.style.display = codeElement.style.display === 'none' ? 'block' : 'none';
    }
}

// Function to add a toggle button under the <pre> element
function addToggleButton(preElement) {
    // Check if the button already exists
    if (!preElement.querySelector('.toggle-button')) {
        const button = document.createElement('button');
        button.innerText = 'Toggle Code Visibility';
        button.className = 'toggle-button';
        button.style.marginTop = '8px'; // Add some spacing
        button.onclick = () => toggleCodeVisibility(preElement);
        toggleCodeVisibility(preElement); // Hide the code initially

        preElement.insertBefore(button, preElement.firstChild);
    }
}

// Mutation observer to watch for new <pre> elements with class "overflow-visible"
const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1 && node.tagName.toLowerCase() === 'pre') {
                const classList = Array.from(node.classList);
                const hasOverflowVisible = classList.some(cls => cls.replace('!', '') === 'overflow-visible');
                
                if (hasOverflowVisible) {
                    addToggleButton(node);
                }
            }
        });
    });
});

// Start observing the document body for added nodes
observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Initial check for existing <pre> elements
document.querySelectorAll('pre.\\!overflow-visible')?.forEach(preElement => {
    addToggleButton(preElement);
});
