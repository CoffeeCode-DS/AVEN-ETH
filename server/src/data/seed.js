export const users = [
  {
    id: "user_client_1",
    name: "Sarah Chen",
    email: "client@aven.dev",
    password: "password123",
    role: "CLIENT",
    avatar: "SC",
    walletAddress: "0x9F2c8A49d4901bDeE27c94726eF28e19B864B7e",
    walletBalance: 25.0,
    title: "Project Lead & Protocol Architect",
    createdAt: new Date().toISOString(),
  },
  {
    id: "user_freelancer_1",
    name: "Marcus Rivera",
    email: "freelancer@aven.dev",
    password: "password123",
    role: "FREELANCER",
    avatar: "MR",
    walletAddress: "0x1aD88B92e105e4dCfD4930198Eb811b7d530E20f",
    walletBalance: 0.0,
    title: "Full-Stack Engineer & Smart Contract Specialist",
    skills: ["Solidity", "React", "Node.js", "EVM", "UI Systems"],
    hourlyRate: 0.015,
    createdAt: new Date().toISOString(),
  },
  {
    id: "user_freelancer_2",
    name: "Priya Nair",
    email: "priya@aven.dev",
    password: "password123",
    role: "FREELANCER",
    avatar: "PN",
    walletAddress: "0x77Bc3D848574Fe88a9134aE8826bFe38A499A31",
    walletBalance: 0.0,
    title: "UI/UX Design & Frontend Specialist",
    skills: ["React", "Design Systems", "Figma", "UI/UX"],
    hourlyRate: 0.011,
    createdAt: new Date().toISOString(),
  },
];

export const agreements = [];
export const workSessions = [];
export const submissions = [];
export const attestations = [];
export const transactions = [];
export const notifications = [];
