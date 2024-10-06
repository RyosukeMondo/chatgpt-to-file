export function log(message, ...optionalParams) {
  console.log(`[Background] ${message}`, ...optionalParams);
}

export function normalizePath(path) {
  return path.replace(/\\/g, '/').replace(/\/+/g, '/').replace(/^\.\//, '');
}
