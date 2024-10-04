// scripts/storage.js

import { log, normalizePath } from './utils.js';

export const Storage = {
  getSyncData(keys) {
    return new Promise((resolve) => {
      chrome.storage.sync.get(keys, (data) => {
        if (chrome.runtime.lastError) {
          log('Error fetching sync data:', chrome.runtime.lastError);
          resolve({});
        } else {
          resolve(data);
        }
      });
    });
  },

  setSyncData(data) {
    return new Promise((resolve) => {
      chrome.storage.sync.set(data, () => {
        if (chrome.runtime.lastError) {
          log('Error setting sync data:', chrome.runtime.lastError);
        }
        resolve();
      });
    });
  },

  saveFileToLocal(filePath, content) {
    const normalizedFilePath = normalizePath(filePath);
    const key = `${normalizedFilePath}`;
    localStorage.setItem(key, content);
    log(`Saved file to localStorage with key ${key}`);
  },

  getFilesForDestination(destination) {
    const normalizedDestination = normalizePath(destination);
    const files = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      // localStorage.removeItem(key);
      if (normalizePath(key).startsWith(normalizedDestination)) {
        files.push({ filePath: key });
      }
    }
    return files;
  },

  clearFilesForDestination(destination) {
    const keysToRemove = [];
    const normalizedDestination = normalizePath(destination);
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (normalizePath(key).startsWith(normalizedDestination)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
    log(`Cleared files for destination: ${destination}`);
  },

  removeFile(filePath) {
    localStorage.removeItem(filePath);
    log(`Removed file from localStorage: ${filePath}`);
  },

  getFileContent(filePath) {
    return localStorage.getItem(filePath) || 'No content available.';
  },
};
