
const BASE_URL = "https://api.mail.tm";

export const API = {
    async createAccount(username, password) {
        try {
            // 1. Get Domains
            const domainRes = await fetch(`${BASE_URL}/domains`);
            if (!domainRes.ok) throw new Error("Failed to fetch domains");
            const domains = await domainRes.json();
            const domain = domains['hydra:member'][0].domain;
            const email = `${username}@${domain}`;

            // 2. Create Account
            const accRes = await fetch(`${BASE_URL}/accounts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: email, password: password })
            });

            if (!accRes.ok) {
                // If 422, user might exist, try another? For now just throw.
                const err = await accRes.json();
                console.error("Account creation failed:", err);
                throw new Error("Failed to create account");
            }
            const account = await accRes.json();

            // 3. Get Token
            const tokenRes = await fetch(`${BASE_URL}/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: email, password: password })
            });
            if (!tokenRes.ok) throw new Error("Failed to get token");
            const tokenData = await tokenRes.json();

            return {
                email: account.address,
                token: tokenData.token,
                id: account.id
            };

        } catch (error) {
            console.error("API Error (createAccount):", error);
            return null;
        }
    },

    async getMessages(token) {
        try {
            const response = await fetch(`${BASE_URL}/messages`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error("Failed to fetch messages");
            const data = await response.json();
            return data['hydra:member']; // Array of messages
        } catch (error) {
            console.error("API Error (getMessages):", error);
            return [];
        }
    },

    async readMessage(token, id) {
        try {
            const response = await fetch(`${BASE_URL}/messages/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error("Failed to read message");
            return await response.json();
        } catch (error) {
            console.error("API Error (readMessage):", error);
            return null;
        }
    }
};
