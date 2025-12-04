
// Matches 4 to 8 digits that are isolated (not part of a phone number or date)
const otpRegex = /(?<!\d)\d{4,8}(?!\d)/;

export function extractOTP(text) {
    const match = text.match(otpRegex);
    return match ? match[0] : null;
}
