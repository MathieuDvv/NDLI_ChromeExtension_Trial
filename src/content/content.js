
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
