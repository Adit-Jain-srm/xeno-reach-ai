const FIRST_NAMES_MALE = [
  'Aarav', 'Advik', 'Arjun', 'Aditya', 'Ansh', 'Arnav', 'Ayaan', 'Dhruv', 'Ishaan', 'Kabir',
  'Krishna', 'Manav', 'Neel', 'Om', 'Parth', 'Pranav', 'Rayan', 'Reyansh', 'Rohan', 'Sahil',
  'Samar', 'Shaurya', 'Siddharth', 'Tanmay', 'Veer', 'Viaan', 'Vivaan', 'Yash', 'Zain', 'Aman',
  'Akash', 'Ankit', 'Chirag', 'Deepak', 'Gaurav', 'Harsh', 'Jay', 'Karan', 'Laksh', 'Mihir',
  'Nikhil', 'Prateek', 'Raj', 'Rishi', 'Sagar', 'Suresh', 'Tarun', 'Uday', 'Varun', 'Yuvraj',
];

const FIRST_NAMES_FEMALE = [
  'Aanya', 'Aditi', 'Ananya', 'Diya', 'Isha', 'Kavya', 'Kiara', 'Meera', 'Myra', 'Navya',
  'Pari', 'Prisha', 'Riya', 'Saanvi', 'Sara', 'Shreya', 'Siya', 'Tara', 'Zara', 'Aadhya',
  'Anika', 'Avni', 'Bhavya', 'Charvi', 'Divya', 'Eshika', 'Fatima', 'Gauri', 'Hiya', 'Ira',
  'Jiya', 'Kashvi', 'Lavanya', 'Mahira', 'Nisha', 'Palak', 'Radhika', 'Sakshi', 'Tanvi', 'Uma',
  'Vanya', 'Wridhi', 'Yashvi', 'Zoya', 'Pooja', 'Neha', 'Priya', 'Sneha', 'Swati', 'Kritika',
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Gupta', 'Singh', 'Kumar', 'Patel', 'Joshi', 'Reddy', 'Nair', 'Iyer',
  'Mehta', 'Shah', 'Desai', 'Chopra', 'Malhotra', 'Bose', 'Das', 'Ghosh', 'Banerjee', 'Mukherjee',
  'Rao', 'Pillai', 'Menon', 'Thakur', 'Chauhan', 'Pandey', 'Mishra', 'Saxena', 'Agarwal', 'Jain',
  'Kapoor', 'Khanna', 'Bhatia', 'Sinha', 'Tiwari', 'Dubey', 'Yadav', 'Kulkarni', 'Deshpande', 'Patil',
];

const EMAIL_DOMAINS = ['gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com', 'proton.me'];

export function generateName(): { name: string; gender: 'male' | 'female' } {
  const gender = Math.random() > 0.5 ? 'male' : 'female';
  const firstNames = gender === 'male' ? FIRST_NAMES_MALE : FIRST_NAMES_FEMALE;
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return { name: `${firstName} ${lastName}`, gender };
}

export function generateEmail(name: string): string {
  const domain = EMAIL_DOMAINS[Math.floor(Math.random() * EMAIL_DOMAINS.length)];
  const parts = name.toLowerCase().split(' ');
  const variants = [
    `${parts[0]}.${parts[1]}`,
    `${parts[0]}${parts[1]}`,
    `${parts[0]}.${parts[1]}${Math.floor(Math.random() * 99)}`,
    `${parts[0]}${Math.floor(Math.random() * 999)}`,
  ];
  return `${variants[Math.floor(Math.random() * variants.length)]}@${domain}`;
}

export function generatePhone(): string {
  const prefixes = ['98', '97', '96', '95', '94', '93', '91', '90', '89', '88', '87', '86', '85', '84', '83', '82', '81', '80', '79', '78', '77', '76', '75', '74', '73', '72', '71', '70'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const rest = String(Math.floor(Math.random() * 100000000)).padStart(8, '0');
  return `+91${prefix}${rest}`;
}
