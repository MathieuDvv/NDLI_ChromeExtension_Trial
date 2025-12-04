// Service Worker for Trial Extension
// Phase 1: Placeholder
import { generateIdentity } from '../utils/generator.js';
import { API } from '../utils/api.js';
import { Storage, IDENTITY_KEY } from '../utils/storage.js';
import { extractOTP } from '../utils/parser.js';

console.log("Trial Service Worker Loaded");

// Setup Alarm for polling
chrome.alarms.create('inboxPolling', { periodInMinutes: 0.16 }); // ~10 seconds

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'inboxPolling') {
        await checkInbox();
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'CMD_GENERATE_IDENTITY') {
        handleGenerateIdentity().then(sendResponse);
        return true; // Keep channel open for async response
    } else if (message.action === 'CMD_CHECK_INBOX') {
        checkInbox().then(sendResponse);
        return true;
    }
});

chrome.runtime.onInstalled.addListener(() => {
    console.log("Trial Extension Installed");
});

async function handleGenerateIdentity() {
    try {
        // 1. Generate local data
        const identity = generateIdentity();

        // 2. Create Mail.tm account
        // Use generated username and password for the mail account too
        const mailData = await API.createAccount(identity.username, identity.password);

        if (mailData) {
            identity.email = mailData.email;
            identity.token = mailData.token;
            identity.accountId = mailData.id;
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

async function checkInbox() {
    try {
        const identity = await Storage.get(IDENTITY_KEY);
        if (!identity || !identity.token) return { status: 'no_identity' };

        const messages = await API.getMessages(identity.token);

        let latestOTP = null;
        if (messages.length > 0) {
            // Fetch latest message content
            const latestMsg = messages[0];
            // Mail.tm returns 'intro' in the list, but for full body we need readMessage
            // But wait, Mail.tm message object has 'intro'. 
            // Let's fetch full content to be sure.
            const fullMsg = await API.readMessage(identity.token, latestMsg.id);
            if (fullMsg) {
                // Mail.tm puts text in 'text' or 'html'
                const content = fullMsg.text || fullMsg.html || fullMsg.intro;
                latestOTP = extractOTP(content) || extractOTP(fullMsg.subject);
            }
        }

        return { status: 'success', messages, latestOTP };

    } catch (error) {
        console.error("Error checking inbox:", error);
        return { status: 'error', message: error.toString() };
    }
}
