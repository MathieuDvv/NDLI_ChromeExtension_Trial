
const firstNames = [
  "James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda", "David", "Elizabeth",
  "William", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen",
  "Christopher", "Nancy", "Daniel", "Lisa", "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra"
];

const lastNames = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
  "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
  "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson"
];

const adjectives = [
  "Swift", "Silent", "Hidden", "Neon", "Cyber", "Ghost", "Shadow", "Rapid", "Digital", "Prime",
  "Hyper", "Mega", "Ultra", "Turbo", "Quantum", "Flux", "Zero", "Null", "Void", "Echo"
];

const nouns = [
  "Fox", "Eagle", "Wolf", "Bear", "Hawk", "Tiger", "Lion", "Panther", "Shark", "Whale",
  "Falcon", "Raven", "Owl", "Cobra", "Viper", "Dragon", "Phoenix", "Griffin", "Titan", "Ranger"
];

export function generateName() {
  const first = firstNames[Math.floor(Math.random() * firstNames.length)];
  const last = lastNames[Math.floor(Math.random() * lastNames.length)];
  return {
    firstName: first,
    lastName: last,
    fullName: `${first} ${last}`
  };
}

export function generateUsername(firstName, lastName) {
  const randomNum = Math.floor(Math.random() * 1000);
  // Strategy 1: FirstLast123
  if (Math.random() > 0.5) {
      return `${firstName.toLowerCase()}${lastName.toLowerCase()}${randomNum}`;
  }
  // Strategy 2: AdjectiveNoun123
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj.toLowerCase()}${noun.toLowerCase()}${randomNum}`;
}

export function generatePassword(length = 16) {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
  let retVal = "";
  for (let i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n));
  }
  return retVal;
}

export function generateIdentity() {
    const name = generateName();
    const username = generateUsername(name.firstName, name.lastName);
    const password = generatePassword();
    
    return {
        firstName: name.firstName,
        lastName: name.lastName,
        username: username,
        password: password,
        created_at: Date.now()
    };
}
