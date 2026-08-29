import { db } from "../data/store.js";

export const CATEGORIES = [
  "Freelance",
  "Salary",
  "Bounty",
  "Grant",
  "AgentTask",
  "Subscription",
];

const CATEGORY_MULTIPLIERS = {
  Grant: 1.3,
  Bounty: 1.2,
  Freelance: 1.1,
  Salary: 1.0,
  AgentTask: 1.0,
  Subscription: 1.0,
};

const MAX_SCORE = 10000;

export function getRecencyMultiplier(createdAt) {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);

  if (ageDays <= 7) {
    return { window: "Hot", multiplier: 1.5, label: "< 7 days (150%)" };
  } else if (ageDays <= 50) {
    return { window: "Warm", multiplier: 1.2, label: "7-50 days (120%)" };
  } else {
    return { window: "Cold", multiplier: 1.0, label: "> 50 days (100%)" };
  }
}

export function scoreAttestation(attestation) {
  const baseScore = 10;
  const amount = Number(attestation.amountPaid || 0);
  // Payment bonus: up to 100 points scaled by stream amount
  const paymentBonus = Math.min(100, Math.floor(amount * 200));

  const recency = getRecencyMultiplier(attestation.createdAt || attestation.timestamp);
  const categoryMultiplier = CATEGORY_MULTIPLIERS[attestation.category] || 1.0;
  const clientConfirmationMultiplier = attestation.clientConfirmed ? 2.0 : 1.0;

  const rawScore =
    (baseScore + paymentBonus) *
    recency.multiplier *
    categoryMultiplier *
    clientConfirmationMultiplier;

  const roundedScore = Math.round(rawScore * 10) / 10;

  return {
    attestationId: attestation.id,
    baseScore,
    paymentBonus,
    recencyWindow: recency.window,
    recencyMultiplier: recency.multiplier,
    category: attestation.category || "Freelance",
    categoryMultiplier,
    clientConfirmed: Boolean(attestation.clientConfirmed),
    clientConfirmationMultiplier,
    totalPoints: roundedScore,
  };
}

export function computeReputation(recipientId) {
  const attestations = db.attestations ? db.attestations.find((a) => a.recipient === recipientId) : [];

  const categoryBreakdown = {};
  for (const cat of CATEGORIES) {
    categoryBreakdown[cat] = { score: 0, count: 0, volume: 0 };
  }

  const recencyDistribution = {
    Hot: 0,
    Warm: 0,
    Cold: 0,
  };

  let totalRawScore = 0;
  let totalVolumeEarned = 0;

  const scoredAttestations = attestations
    .map((att) => {
      const breakdown = scoreAttestation(att);
      totalRawScore += breakdown.totalPoints;
      totalVolumeEarned += Number(att.amountPaid || 0);

      const cat = breakdown.category;
      if (!categoryBreakdown[cat]) {
        categoryBreakdown[cat] = { score: 0, count: 0, volume: 0 };
      }
      categoryBreakdown[cat].score = Math.round((categoryBreakdown[cat].score + breakdown.totalPoints) * 10) / 10;
      categoryBreakdown[cat].count += 1;
      categoryBreakdown[cat].volume = Math.round((categoryBreakdown[cat].volume + Number(att.amountPaid || 0)) * 10000) / 10000;

      recencyDistribution[breakdown.recencyWindow] = (recencyDistribution[breakdown.recencyWindow] || 0) + 1;

      return {
        ...att,
        scoreBreakdown: breakdown,
      };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const totalScore = Math.min(MAX_SCORE, Math.round(totalRawScore));

  return {
    recipientId,
    totalScore,
    maxScore: MAX_SCORE,
    scorePercentage: Math.min(100, Math.round((totalScore / MAX_SCORE) * 100)),
    totalAttestations: attestations.length,
    totalVolumeEarned: Math.round(totalVolumeEarned * 10000) / 10000,
    categoryBreakdown,
    recencyDistribution,
    attestations: scoredAttestations,
  };
}
