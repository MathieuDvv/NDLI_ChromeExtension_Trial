import { generateIdentity } from '../utils/generator.js';
import { Storage, IDENTITY_KEY } from '../utils/storage.js';

const els = {
    fullName: document.getElementById('full-name'),
    username: document.getElementById('username'),
    password: document.getElementById('password'),
    email: document.getElementById('email'),
    btnGenerate: document.getElementById('btn-generate'),
    // Inbox elements
    emailList: document.getElementById('email-list'),
    otpDisplay: document.getElementById('otp-display'),
    otpCode: document.getElementById('otp-code'),
    btnCopyOtp: document.getElementById('btn-copy-otp')
};

async function updateUI(identity) {
    if (!identity) return;

    els.fullName.textContent = `${identity.firstName} ${identity.lastName}`;
    els.username.textContent = identity.username;
    els.password.textContent = identity.password;
    // Email logic will be added in Phase 2, for now placeholder or generated if we add it to generator
    els.email.textContent = identity.email || "Not connected";
}

async function checkInbox() {
    try {
        const response = await chrome.runtime.sendMessage({ action: 'CMD_CHECK_INBOX' });
        if (response && response.status === 'success') {
            renderInbox(response.messages);
            if (response.latestOTP) {
                showOTP(response.latestOTP);
            }
        }
    } catch (err) {
        console.error("Inbox check error:", err);
    }
}

function renderInbox(messages) {
    els.emailList.innerHTML = '';
    if (!messages || messages.length === 0) {
        els.emailList.innerHTML = '<div class="empty-state">No emails yet...</div>';
        return;
    }

    messages.forEach(msg => {
        const item = document.createElement('div');
        item.className = 'email-item';
        item.innerHTML = `
      <div class="email-subject">${msg.subject}</div>
      <div class="email-from">${msg.from}</div>
    `;
        els.emailList.appendChild(item);
    });
}

function showOTP(code) {
    els.otpCode.textContent = code;
    els.otpDisplay.classList.remove('hidden');
}

async function handleGenerate() {
    // Set loading state
    els.btnGenerate.textContent = "GENERATING...";
    els.btnGenerate.disabled = true;

    try {
        const response = await chrome.runtime.sendMessage({ action: 'CMD_GENERATE_IDENTITY' });

        if (response && response.status === 'success') {
            updateUI(response.identity);
        } else {
            console.error("Generation failed:", response);
        }
    } catch (err) {
        console.error("Message error:", err);
    } finally {
        els.btnGenerate.textContent = "NEW IDENTITY";
        els.btnGenerate.disabled = false;
    }
}

els.btnCopyOtp.addEventListener('click', () => {
    const code = els.otpCode.textContent;
    navigator.clipboard.writeText(code).then(() => {
        // Visual feedback
        els.btnCopyOtp.style.color = '#fff';
        setTimeout(() => {
            els.btnCopyOtp.style.color = '';
        }, 200);
    });
});

async function init() {
    const identity = await Storage.get(IDENTITY_KEY);
    if (identity) {
        updateUI(identity);
        checkInbox(); // Check inbox on open
    } else {
        await handleGenerate();
    }
}

// Poll inbox while popup is open (every 5s)
setInterval(checkInbox, 5000);

els.btnGenerate.addEventListener('click', handleGenerate);

// Copy functionality
document.querySelectorAll('.data-row').forEach(row => {
    row.addEventListener('click', () => {
        const value = row.querySelector('.value').textContent;
        navigator.clipboard.writeText(value).then(() => {
            // Visual feedback could go here
            const originalBg = row.style.backgroundColor;
            row.style.backgroundColor = 'var(--success-color)';
            row.querySelector('.value').style.color = '#000';
            setTimeout(() => {
                row.style.backgroundColor = '';
                row.querySelector('.value').style.color = '';
            }, 200);
        });
    });
});

init();
