// Service Worker for Trial Extension
// Phase 1: Placeholder
import { generateIdentity } from '../utils/generator.js';
import { API } from '../utils/api.js';
import { Storage, IDENTITY_KEY } from '../utils/storage.js';

console.log("Trial Service Worker Loaded");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'CMD_GENERATE_IDENTITY') {
        handleGenerateIdentity().then(sendResponse);
        return true; // Keep channel open for async response
    }
});

chrome.runtime.onInstalled.addListener(() => {
    console.log("Trial Extension Installed");
});

async function handleGenerateIdentity() {
    try {
        // 1. Generate local data (Name, Pass, etc.)
        const identity = generateIdentity();

        // 2. Fetch real email from API
        const email = await API.generateEmail();

        if (email) {
            identity.email = email;
            const [login, domain] = email.split('@');
            identity.login = login;
            identity.domain = domain;
        } else {
            identity.email = "error@try-again.com";
        }

        // 3. Save to storage
        await Storage.set(IDENTITY_KEY, identity);

        return { status: 'success', identity };
    } catch (error) {
        console.error("Error generating identity:", error);
        return { status: 'error', message: error.toString() };
    }
}
