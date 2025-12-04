import { generateIdentity } from '../utils/generator.js';
import { Storage, IDENTITY_KEY } from '../utils/storage.js';

const els = {
    fullName: document.getElementById('full-name'),
    username: document.getElementById('username'),
    email: document.getElementById('email'),
    password: document.getElementById('password'),
    phone: document.getElementById('phone'),

    btnNew: document.getElementById('btn-new'),
    btnHide: document.getElementById('btn-hide'),
    btnShowPass: document.getElementById('btn-show-pass'),
    apiStatus: document.querySelector('.status-indicator'),

    inboxSection: document.getElementById('inbox-section'),
    emptyState: document.getElementById('empty-state'),
    emailList: document.getElementById('email-list')
};

let currentIdentity = null;
let isIdentityHidden = false;
let isPasswordVisible = false;

// --- UI Updates ---

function updateUI(identity) {
    if (!identity) return;
    currentIdentity = identity;

    els.fullName.textContent = `${identity.firstName} ${identity.lastName}`;
    els.username.textContent = identity.username;
    els.email.textContent = identity.email || "Generating...";
    els.phone.textContent = identity.phone || "None";

    renderPassword();
    applyVisibility();
}

function renderPassword() {
    if (!currentIdentity) return;
    if (isPasswordVisible) {
        els.password.textContent = currentIdentity.password;
        els.btnShowPass.textContent = "hide";
    } else {
        els.password.textContent = "••••••••••••••••";
        els.btnShowPass.textContent = "show";
    }
}

function applyVisibility() {
    const sensitiveEls = [els.fullName, els.username, els.email, els.password, els.phone];
    sensitiveEls.forEach(el => {
        if (isIdentityHidden) {
            el.classList.add('blur');
        } else {
            el.classList.remove('blur');
        }
    });
    els.btnHide.textContent = isIdentityHidden ? "show identity" : "hide identity";
}

function toggleIdentityVisibility() {
    isIdentityHidden = !isIdentityHidden;
    applyVisibility();
}

async function checkApiStatus() {
    try {
        // Simple ping to Mail.tm domains endpoint
        const res = await fetch("https://api.mail.tm/domains");
        if (res.ok) {
            els.apiStatus.textContent = "api ok";
            els.apiStatus.style.borderColor = "var(--accent-green-bright)";
            els.apiStatus.style.color = "var(--accent-green-bright)";
        } else {
            throw new Error("API Down");
        }
    } catch (e) {
        els.apiStatus.textContent = "api down";
        els.apiStatus.style.borderColor = "red";
        els.apiStatus.style.color = "red";
    }
}

// --- Actions ---

async function handleGenerate() {
    els.btnNew.textContent = "gen...";
    els.btnNew.disabled = true;
    renderInbox([]);

    try {
        const response = await chrome.runtime.sendMessage({ action: 'CMD_GENERATE_IDENTITY' });
        if (response && response.status === 'success') {
            updateUI(response.identity);
        }
    } catch (err) {
        console.error("Gen error:", err);
    } finally {
        els.btnNew.textContent = "new";
        els.btnNew.disabled = false;
    }
}

async function checkInbox() {
    try {
        const response = await chrome.runtime.sendMessage({ action: 'CMD_CHECK_INBOX' });
        if (response && response.status === 'success') {
            renderInbox(response.messages);
        }
    } catch (err) {
        console.error("Inbox error:", err);
    }
}

function renderInbox(messages) {
    els.emailList.innerHTML = '';

    if (!messages || messages.length === 0) {
        els.emptyState.style.display = 'flex';
        els.emailList.classList.add('hidden');
        return;
    }

    els.emptyState.style.display = 'none';
    els.emailList.classList.remove('hidden');

    messages.forEach(msg => {
        // Improved Regex: Matches 4-8 digits, or G-123456 style
        const subject = msg.subject || "";
        const intro = msg.intro || "";
        const combined = subject + " " + intro;

        const otpMatch = combined.match(/(?<!\d)(\d{4,8}|[A-Z]-\d{4,8})(?!\d)/);
        const otp = otpMatch ? otpMatch[0] : "OPEN";

        // Extract Link: First http/https link
        const linkMatch = combined.match(/https?:\/\/[^\s]+/);
        const link = linkMatch ? linkMatch[0] : "#";

        const card = document.createElement('div');
        card.className = 'email-card';

        // Lucide Copy Icon SVG
        const copyIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;

        card.innerHTML = `
      <div class="email-info">${msg.from.name || msg.from.address}</div>
      <div class="otp-container">
        <div class="otp-badge" title="Copy Code">
          ${otp} <span class="icon-copy">${copyIcon}</span>
        </div>
        <a href="${link}" target="_blank" class="icon-link">↗</a>
      </div>
    `;

        // Copy Event
        card.querySelector('.otp-badge').addEventListener('click', (e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(otp);
            const badge = e.currentTarget;
            badge.style.backgroundColor = "var(--accent-green-bright)";
            badge.style.color = "#000";
            setTimeout(() => {
                badge.style.backgroundColor = "";
                badge.style.color = "";
            }, 200);
        });

        els.emailList.appendChild(card);
    });
}

// --- Edit & Copy Logic ---

function setupEditCopy() {
    // Copy on click (when not editing)
    document.querySelectorAll('.grid-value').forEach(el => {
        el.addEventListener('click', () => {
            if (el.isContentEditable) return;
            if (el.id === 'password' && !isPasswordVisible) return; // Don't copy masked password

            const text = el.textContent;
            navigator.clipboard.writeText(text);

            // Flash feedback
            const originalColor = el.style.color;
            el.style.color = "var(--accent-green-bright)";
            setTimeout(() => el.style.color = originalColor, 200);
        });
    });

    // Edit/Add buttons
    document.querySelectorAll('.btn-small').forEach(btn => {
        if (btn.textContent === 'edit' || btn.textContent === 'add') {
            btn.addEventListener('click', (e) => {
                const row = btn.closest('.grid-row');
                const valueEl = row.querySelector('.grid-value');
                const originalText = btn.textContent;

                if (valueEl.isContentEditable) {
                    // Save
                    valueEl.contentEditable = "false";
                    valueEl.classList.remove('editing');
                    // Once added/edited, it becomes editable, so button should be 'edit'
                    btn.textContent = 'edit';

                    // Update local storage
                    if (currentIdentity) {
                        if (valueEl.id === 'full-name') {
                            const parts = valueEl.textContent.split(' ');
                            currentIdentity.firstName = parts[0];
                            currentIdentity.lastName = parts.slice(1).join(' ');
                        } else {
                            currentIdentity[valueEl.id] = valueEl.textContent;
                        }
                        Storage.set(IDENTITY_KEY, currentIdentity);
                    }
                } else {
                    // Edit
                    valueEl.contentEditable = "true";
                    valueEl.classList.add('editing');
                    valueEl.focus();
                    // If it was "None", clear it for easier typing
                    if (valueEl.textContent === "None") valueEl.textContent = "";

                    btn.textContent = "save";
                }
            });
        }
    });
}

// --- Init ---

async function init() {
    const identity = await Storage.get(IDENTITY_KEY);
    if (identity) {
        updateUI(identity);
        checkInbox();
    } else {
        handleGenerate();
    }
    checkApiStatus();
    setupEditCopy();
}

// Listeners
els.btnNew.addEventListener('click', handleGenerate);
els.btnHide.addEventListener('click', toggleIdentityVisibility);
els.btnShowPass.addEventListener('click', () => {
    isPasswordVisible = !isPasswordVisible;
    renderPassword();
});

// Poll
setInterval(checkInbox, 5000);
setInterval(checkApiStatus, 60000); // Check API every minute

init();
