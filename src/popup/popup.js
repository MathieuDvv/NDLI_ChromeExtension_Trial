import { generateIdentity } from '../utils/generator.js';
import { Storage, IDENTITY_KEY } from '../utils/storage.js';

const els = {
    fullName: document.getElementById('full-name'),
    username: document.getElementById('username'),
    password: document.getElementById('password'),
    email: document.getElementById('email'),
    btnGenerate: document.getElementById('btn-generate')
};

async function updateUI(identity) {
    if (!identity) return;

    els.fullName.textContent = `${identity.firstName} ${identity.lastName}`;
    els.username.textContent = identity.username;
    els.password.textContent = identity.password;
    // Email logic will be added in Phase 2, for now placeholder or generated if we add it to generator
    els.email.textContent = identity.email || "Not connected";
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

async function init() {
    const identity = await Storage.get(IDENTITY_KEY);
    if (identity) {
        updateUI(identity);
    } else {
        await handleGenerate();
    }
}

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
