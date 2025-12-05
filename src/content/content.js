
console.log("Trial Content Script Loaded");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'CMD_AUTOFILL') {
        fillForm(message.identity);
    }
});

function fillForm(identity) {
    const inputs = document.querySelectorAll('input');

    inputs.forEach(input => {
        // Skip hidden or disabled inputs
        if (input.type === 'hidden' || input.disabled) return;

        const type = input.type.toLowerCase();
        const name = (input.name || '').toLowerCase();
        const id = (input.id || '').toLowerCase();
        const placeholder = (input.placeholder || '').toLowerCase();

        let valueToFill = null;

        // Heuristics for detection
        if (isEmail(type, name, id, placeholder)) {
            valueToFill = identity.email;
        } else if (isUsername(type, name, id, placeholder)) {
            valueToFill = identity.username;
        } else if (isPassword(type, name, id, placeholder)) {
            valueToFill = identity.password;
        } else if (isName(type, name, id, placeholder)) {
            // Try to detect First vs Last
            if (name.includes('first') || id.includes('first') || placeholder.includes('first')) {
                valueToFill = identity.firstName;
            } else if (name.includes('last') || id.includes('last') || placeholder.includes('last')) {
                valueToFill = identity.lastName;
            } else {
                valueToFill = `${identity.firstName} ${identity.lastName}`;
            }
        } else if (isPhone(type, name, id, placeholder)) {
            if (identity.phone && identity.phone !== "None") {
                // Disclaimer for phone number
                const confirmed = window.confirm(
                    "⚠️ SECURITY WARNING: You are about to use your REAL phone number.\n\n" +
                    "Some services link accounts to phone numbers. Using this number might prevent you from using it on other accounts or link this burner identity to your real identity.\n\n" +
                    "Do you want to proceed?"
                );
                if (confirmed) {
                    valueToFill = identity.phone;
                }
            }
        }

        if (valueToFill) {
            setNativeValue(input, valueToFill);
            highlightInput(input);
        }
    });
}

// Helper functions for heuristics
function isEmail(type, name, id, placeholder) {
    return type === 'email' || name.includes('email') || id.includes('email') || placeholder.includes('email');
}

function isUsername(type, name, id, placeholder) {
    return name.includes('user') || id.includes('user') || placeholder.includes('user') || name.includes('login');
}

function isPassword(type, name, id, placeholder) {
    return type === 'password' || name.includes('pass') || id.includes('pass');
}

function isName(type, name, id, placeholder) {
    return name.includes('name') || id.includes('name') || placeholder.includes('name');
}

function isPhone(type, name, id, placeholder) {
    return type === 'tel' || name.includes('phone') || id.includes('phone') || placeholder.includes('phone') || name.includes('mobile');
}

// React/Vue compatible value setter
function setNativeValue(element, value) {
    const lastValue = element.value;
    element.value = value;

    const event = new Event('input', { bubbles: true });
    // Hack for React 15/16
    const tracker = element._valueTracker;
    if (tracker) {
        tracker.setValue(lastValue);
    }
    element.dispatchEvent(event);
    element.dispatchEvent(new Event('change', { bubbles: true }));
}

function highlightInput(element) {
    const originalBorder = element.style.border;
    const originalShadow = element.style.boxShadow;

    element.style.border = '1px solid #00FF94';
    element.style.boxShadow = '0 0 5px #00FF94';

    setTimeout(() => {
        element.style.border = originalBorder;
        element.style.boxShadow = originalShadow;
    }, 500);
}

// Experimental: In-Page Autofill Button
function injectAutofillButton() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        // Check if form has relevant fields
        const hasPassword = form.querySelector('input[type="password"]');
        const hasEmail = form.querySelector('input[type="email"]') || form.querySelector('input[name*="email"]');

        if (hasPassword || hasEmail) {
            // Check if we already injected
            if (form.dataset.trialInjected) return;
            form.dataset.trialInjected = "true";

            const buttonContainer = document.createElement('div');
            // Position it: Try to find the submit button
            const submitBtn = form.querySelector('input[type="submit"], button[type="submit"], button');

            if (submitBtn) {
                // Insert after the submit button to place it "under"
                submitBtn.insertAdjacentElement('afterend', buttonContainer);
            } else {
                // Or just append to form
                form.appendChild(buttonContainer);
            }

            // Shadow DOM to isolate styles
            const shadow = buttonContainer.attachShadow({ mode: 'open' });

            const iconUrl = chrome.runtime.getURL('assets/icon48.png');

            shadow.innerHTML = `
                <style>
                    :host {
                        display: block;
                        margin: 10px 0;
                        font-family: monospace;
                        width: fit-content;
                    }
                    .trial-btn {
                        background-color: #000;
                        color: #fff;
                        border: 1px solid #333;
                        border-radius: 9999px;
                        padding: 8px 20px;
                        font-family: 'Courier New', Courier, monospace;
                        font-size: 14px;
                        font-weight: 500;
                        cursor: pointer;
                        display: inline-flex;
                        align-items: center;
                        gap: 10px;
                        transition: transform 0.1s, box-shadow 0.1s, border-color 0.1s;
                        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                        text-decoration: none;
                        line-height: 1;
                        white-space: nowrap;
                    }
                    .trial-btn:hover {
                        border-color: #00FF94;
                    }
                    .trial-btn:active {
                        transform: translateY(0);
                    }
                    .icon-circle {
                        background: #fff;
                        border-radius: 50%;
                        width: 20px;
                        height: 20px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        flex-shrink: 0;
                    }
                    .icon-img {
                        width: 14px;
                        height: 14px;
                        display: block;
                    }
                </style>
                <button class="trial-btn" type="button">
                    <div class="icon-circle">
                        <img src="${iconUrl}" class="icon-img" alt="Trial Icon" />
                    </div>
                    Try the website
                </button>
            `;

            const btn = shadow.querySelector('.trial-btn');
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();

                // Get identity
                chrome.storage.local.get(['currentIdentity'], (result) => {
                    if (result.currentIdentity) {
                        fillForm(result.currentIdentity);
                    } else {
                        // Generate new
                        chrome.runtime.sendMessage({ action: 'CMD_GENERATE_IDENTITY' }, (response) => {
                            if (response && response.identity) {
                                fillForm(response.identity);
                            }
                        });
                    }
                });
            });
        }
    });
}

// Run injection
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectAutofillButton);
} else {
    injectAutofillButton();
}

// Observe for dynamic forms
const observer = new MutationObserver((mutations) => {
    injectAutofillButton();
});
observer.observe(document.body, { childList: true, subtree: true });
