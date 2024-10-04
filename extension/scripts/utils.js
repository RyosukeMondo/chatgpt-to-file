// scripts/utils.js

export function log(message, ...optionalParams) {
  console.log(`[OptionsPage] ${message}`, ...optionalParams);
}

export function normalizePath(path) {
  return path.replace(/\\/g, '/').replace(/\/+/g, '/').replace(/^\.\//, '');
}

export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
