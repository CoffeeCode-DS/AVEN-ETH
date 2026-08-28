import { nowIso } from "../utils/simulate.js";

// Fixed ids (not random) so the demo is reproducible run-to-run.

export const users = [
  {
    id: "user_client_1",
    name: "Sarah Chen",
    email: "client@aven.dev",
    password: "password123",
    role: "CLIENT",
    avatar: "SC",
    walletAddress: "0x9F2c...4B7e",
    title: "Product Lead, Northwind Retail",
    createdAt: "2026-06-01T09:00:00.000Z",
  },
  {
    id: "user_freelancer_1",
    name: "Marcus Rivera",
    email: "freelancer@aven.dev",
    password: "password123",
    role: "FREELANCER",
    avatar: "MR",
    walletAddress: "0x1aD8...E20f",
    title: "Full-Stack Engineer & Smart Contract Auditor",
    rating: 4.9,
    completedProjects: 27,
    skills: ["React", "Solidity", "Node.js", "UI Design", "Security Audits"],
    hourlyRate: 0.015,
    createdAt: "2026-04-11T09:00:00.000Z",
  },
  // A second freelancer purely so the "select freelancer" step in the
  // agreement wizard has more than one real option to choose from.
  {
    id: "user_freelancer_2",
    name: "Priya Nair",
    email: "priya@aven.dev",
    password: "password123",
    role: "FREELANCER",
    avatar: "PN",
    walletAddress: "0x77Bc...9A31",
    title: "Frontend & Design Systems Specialist",
    rating: 4.8,
    completedProjects: 19,
    skills: ["React", "Design Systems", "Figma", "Accessibility"],
    hourlyRate: 0.011,
    createdAt: "2026-02-20T09:00:00.000Z",
  },
];

function iso(daysFromNow) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString();
}

// Three agreements in three different states so both dashboards look
// alive immediately after login, without needing the evaluator to
// create anything first.
export const agreements = [
  {
    id: "agr_1",
    title: "E-commerce Platform Redesign",
    description:
      "Rebuild the storefront and checkout flow with a component-based design system, improved mobile conversion, and a refreshed visual identity.",
    category: "Web Development",
    clientId: "user_client_1",
    freelancerId: "user_freelancer_1",
    budget: 0.5,
    escrowBalance: 0.5,
    deadline: iso(7),
    status: "SUBMITTED",
    createdAt: iso(-9),
    updatedAt: iso(-1),
  },
  {
    id: "agr_2",
    title: "Mobile App UI Kit",
    description:
      "Design and implement a reusable component library (buttons, forms, navigation, cards) for the companion mobile app, delivered as production React Native components.",
    category: "UI/UX Design",
    clientId: "user_client_1",
    freelancerId: "user_freelancer_1",
    budget: 0.32,
    escrowBalance: 0,
    deadline: iso(-2),
    status: "COMPLETED",
    createdAt: iso(-25),
    updatedAt: iso(-4),
  },
  {
    id: "agr_3",
    title: "Smart Contract Audit",
    description:
      "Full security audit of the AVEN-ETH escrow contract prototype covering reentrancy, access control, and integer overflow classes of bugs, with a written report.",
    category: "Security",
    clientId: "user_client_1",
    freelancerId: "user_freelancer_1",
    budget: 0.175,
    escrowBalance: 0.175,
    deadline: iso(12),
    status: "IN_PROGRESS",
    createdAt: iso(-3),
    updatedAt: iso(-1),
  },
];

export const workSessions = [
  {
    id: "ws_1",
    agreementId: "agr_1",
    freelancerId: "user_freelancer_1",
    status: "STOPPED",
    startedAt: iso(-1.4),
    accumulatedSeconds: 5 * 3600 + 12 * 60,
    segments: [],
    notes: "Implemented responsive checkout flow and cart drawer.",
  },
  {
    id: "ws_3",
    agreementId: "agr_3",
    freelancerId: "user_freelancer_1",
    status: "PAUSED",
    startedAt: iso(-0.3),
    accumulatedSeconds: 1 * 3600 + 40 * 60,
    segments: [],
    notes: "Reviewing escrow release function for reentrancy.",
  },
];

export const submissions = [
  {
    id: "sub_1",
    agreementId: "agr_1",
    freelancerId: "user_freelancer_1",
    description:
      "Checkout flow and cart drawer are fully responsive across breakpoints. Added skeleton loading states and empty-cart illustration. Ready for review.",
    deliverables: [
      "storefront-checkout-v2.zip",
      "design-notes.pdf",
      "mobile-qa-screens.png",
    ],
    submittedAt: iso(-1),
    status: "PENDING_REVIEW",
    revisionCount: 0,
    clientFeedback: null,
  },
  {
    id: "sub_2",
    agreementId: "agr_2",
    freelancerId: "user_freelancer_1",
    description:
      "Full component library delivered with Storybook documentation and dark-mode variants for every component.",
    deliverables: ["ui-kit-v1.0.zip", "storybook-build.zip"],
    submittedAt: iso(-5),
    status: "APPROVED",
    revisionCount: 1,
    clientFeedback: "Looks great after the spacing fixes — approved!",
  },
];

export const transactions = [
  {
    id: "txn_1",
    agreementId: "agr_1",
    fromUser: "user_client_1",
    toUser: "ESCROW_CONTRACT",
    type: "ESCROW_FUNDED",
    amount: 0.5,
    status: "CONFIRMED",
    timestamp: iso(-9),
  },
  {
    id: "txn_2",
    agreementId: "agr_2",
    fromUser: "user_client_1",
    toUser: "ESCROW_CONTRACT",
    type: "ESCROW_FUNDED",
    amount: 0.32,
    status: "CONFIRMED",
    timestamp: iso(-25),
  },
  {
    id: "txn_3",
    agreementId: "agr_2",
    fromUser: "ESCROW_CONTRACT",
    toUser: "user_freelancer_1",
    type: "PAYMENT_RELEASED",
    amount: 0.32,
    status: "CONFIRMED",
    timestamp: iso(-4),
  },
  {
    id: "txn_4",
    agreementId: "agr_2",
    fromUser: "SYSTEM",
    toUser: "user_freelancer_1",
    type: "PROJECT_COMPLETED",
    amount: 0,
    status: "CONFIRMED",
    timestamp: iso(-4),
  },
  {
    id: "txn_5",
    agreementId: "agr_3",
    fromUser: "user_client_1",
    toUser: "ESCROW_CONTRACT",
    type: "ESCROW_FUNDED",
    amount: 0.175,
    status: "CONFIRMED",
    timestamp: iso(-3),
  },
  {
    id: "txn_6",
    agreementId: "agr_1",
    fromUser: "user_freelancer_1",
    toUser: "user_client_1",
    type: "WORK_SUBMITTED",
    amount: 0,
    status: "CONFIRMED",
    timestamp: iso(-1),
  },
];

export const notifications = [
  {
    id: "notif_1",
    userId: "user_client_1",
    type: "WORK_SUBMITTED",
    title: "New submission ready for review",
    message: "Marcus Rivera submitted work for \u201cE-commerce Platform Redesign\u201d.",
    agreementId: "agr_1",
    read: false,
    createdAt: iso(-1),
  },
  {
    id: "notif_2",
    userId: "user_freelancer_1",
    type: "ESCROW_FUNDED",
    title: "Escrow funded",
    message: "Sarah Chen funded escrow for \u201cSmart Contract Audit\u201d.",
    agreementId: "agr_3",
    read: true,
    createdAt: iso(-3),
  },
  {
    id: "notif_3",
    userId: "user_freelancer_1",
    type: "PAYMENT_RELEASED",
    title: "Payment released",
    message: "You received 0.3200 ETH for \u201cMobile App UI Kit\u201d.",
    agreementId: "agr_2",
    read: true,
    createdAt: iso(-4),
  },
  {
    id: "notif_4",
    userId: "user_client_1",
    type: "PROJECT_COMPLETED",
    title: "Project completed",
    message: "\u201cMobile App UI Kit\u201d has been marked complete.",
    agreementId: "agr_2",
    read: true,
    createdAt: iso(-4),
  },
];
