export interface StateTrivia {
  id: string;
  name: string;
  nativeName: string;
  language: string;
  dialect: string;
  stadium: string;
  legend: string;
  trivia: string;
  coordinates: { x: number; y: number }; // Percentage coordinate for UI rendering
}

export const stateTriviaList: StateTrivia[] = [
  {
    id: "maharashtra",
    name: "Maharashtra",
    nativeName: "महाराष्ट्र",
    language: "mr",
    dialect: "Mumbai Tapori",
    stadium: "Wankhede Stadium, Mumbai",
    legend: "Sachin Tendulkar",
    trivia: "Home to the iconic 2011 World Cup winning six spot and the cradle of Mumbai cricket giants.",
    coordinates: { x: 35, y: 55 }
  },
  {
    id: "punjab",
    name: "Punjab",
    nativeName: "ਪੰਜਾਬ",
    language: "pa",
    dialect: "Amritsari Punjabi",
    stadium: "PCA Stadium, Mohali",
    legend: "Yuvraj Singh",
    trivia: "The arena of Yuvraj's epic 6 sixes in an over hype and high energy dhol beats.",
    coordinates: { x: 30, y: 22 }
  },
  {
    id: "karnataka",
    name: "Karnataka",
    nativeName: "ಕರ್ನಾಟಕ",
    language: "kn",
    dialect: "Mysore Kannada",
    stadium: "M. Chinnaswamy Stadium, Bengaluru",
    legend: "Anil Kumble",
    trivia: "Known for Chinnaswamy's short boundaries that guarantee crazy high-scoring ball runs.",
    coordinates: { x: 34, y: 75 }
  },
  {
    id: "tamil_nadu",
    name: "Tamil Nadu",
    nativeName: "தமிழ்நாடு",
    language: "ta",
    dialect: "Chennai Madras Bashai",
    stadium: "M. A. Chidambaram Stadium, Chennai",
    legend: "Ravi Ashwin & MS Dhoni (by adoption)",
    trivia: "Known as 'Anbuden' and home to the yellow CSK brigade whose whistles synthesize a deafening wall of sound.",
    coordinates: { x: 42, y: 85 }
  },
  {
    id: "west_bengal",
    name: "West Bengal",
    nativeName: "পশ্চিমবঙ্গ",
    language: "bn",
    dialect: "Kolkati Bengali",
    stadium: "Eden Gardens, Kolkata",
    legend: "Sourav Ganguly",
    trivia: "One of the world's most atmospheric cricket amphitheaters with a seating volume of over 66,000 screaming fans.",
    coordinates: { x: 74, y: 44 }
  },
  {
    id: "gujarat",
    name: "Gujarat",
    nativeName: "ગુજરાત",
    language: "gu",
    dialect: "Kathiyawadi",
    stadium: "Narendra Modi Stadium, Ahmedabad",
    legend: "Jasprit Bumrah",
    trivia: "The world's largest cricket colosseum with a colossal capacity of 132,000 spectators.",
    coordinates: { x: 20, y: 45 }
  },
  {
    id: "uttar_pradesh",
    name: "Uttar Pradesh",
    nativeName: "उत्तर प्रदेश",
    language: "hi",
    dialect: "Bhojpuri / Awadhi",
    stadium: "Ekana Stadium, Lucknow",
    legend: "Suresh Raina",
    trivia: "Raina's home soil, famous for its slow pitches that make spin bowling a pure technical masterclass.",
    coordinates: { x: 48, y: 32 }
  },
  {
    id: "delhi",
    name: "Delhi",
    nativeName: "दिल्ली",
    language: "hi",
    dialect: "Delhi Punjabi-Hindi Mix",
    stadium: "Arun Jaitley Stadium, Delhi",
    legend: "Virat Kohli",
    trivia: "The cradle of Kohli's aggressive cover drives and fierce street aggression on the international pitch.",
    coordinates: { x: 38, y: 26 }
  }
];
