// content/scripts/toggler.js

const Toggler = (() => {
  function toggleCodeVisibility(preElement) {
    const codeElement = preElement.querySelector('code');
    if (codeElement) {
      codeElement.style.display = codeElement.style.display === 'none' ? 'block' : 'none';
    }
  }

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
      ContentUtils.log('Toggle button added to <pre> element.');
    }
  }

  return {
    toggleCodeVisibility,
    addToggleButton,
  };
})();

window.ContentToggler = Toggler; // Expose to other scripts
