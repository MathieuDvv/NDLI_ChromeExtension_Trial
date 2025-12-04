
const BASE_URL = "https://www.1secmail.com/api/v1/";

export const API = {
    async generateEmail() {
        try {
            const response = await fetch(`${BASE_URL}?action=genRandomMailbox&count=1`);
            if (!response.ok) throw new Error("Network response was not ok");
            const data = await response.json();
            return data[0]; // Returns "email@domain.com"
        } catch (error) {
            console.error("API Error (generateEmail):", error);
            return null;
        }
    },

    async getMessages(login, domain) {
        try {
            const response = await fetch(`${BASE_URL}?action=getMessages&login=${login}&domain=${domain}`);
            if (!response.ok) throw new Error("Network response was not ok");
            return await response.json();
        } catch (error) {
            console.error("API Error (getMessages):", error);
            return [];
        }
    },

    async readMessage(login, domain, id) {
        try {
            const response = await fetch(`${BASE_URL}?action=readMessage&login=${login}&domain=${domain}&id=${id}`);
            if (!response.ok) throw new Error("Network response was not ok");
            return await response.json();
        } catch (error) {
            console.error("API Error (readMessage):", error);
            return null;
        }
    }
};
