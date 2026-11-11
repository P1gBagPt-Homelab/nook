import { and, eq } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "../../lib/db/schema";

export interface SplitMemberSummary {
  id: string;
  name: string;
  email: string;
  role: string;
  paidTotal: number;
  fairShare: number;
  netBalance: number;
}

export interface SplitDebtEdge {
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
}

export interface SplitLedgerState {
  members: SplitMemberSummary[];
  balances: SplitDebtEdge[];
  unsettledTotal: number;
}

function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}

export async function computeSplitLedger(
  db: NodePgDatabase<typeof schema>,
  householdId: string
): Promise<SplitLedgerState> {
  const householdMembers = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      role: schema.users.role,
    })
    .from(schema.users)
    .where(eq(schema.users.householdId, householdId));

  const openSplitExpenses = await db
    .select()
    .from(schema.expenses)
    .where(
      and(
        eq(schema.expenses.householdId, householdId),
        eq(schema.expenses.isSplit, true),
        eq(schema.expenses.isSettled, false)
      )
    );

  const openSettlements = await db
    .select()
    .from(schema.expenseSettlements)
    .where(
      and(
        eq(schema.expenseSettlements.householdId, householdId),
        eq(schema.expenseSettlements.isCleared, false)
      )
    );

  const memberCount = householdMembers.length;
  const paidMap = new Map<string, number>();
  const shareMap = new Map<string, number>();
  const netMap = new Map<string, number>();

  for (const m of householdMembers) {
    paidMap.set(m.id, 0);
    shareMap.set(m.id, 0);
    netMap.set(m.id, 0);
  }

  if (memberCount >= 2) {
    for (const exp of openSplitExpenses) {
      const amount = parseFloat(exp.amount);
      if (isNaN(amount) || amount <= 0) continue;
      if (paidMap.has(exp.paidByUserId)) {
        paidMap.set(exp.paidByUserId, (paidMap.get(exp.paidByUserId) || 0) + amount);
      }
      const equalShare = amount / memberCount;
      for (const m of householdMembers) {
        shareMap.set(m.id, (shareMap.get(m.id) || 0) + equalShare);
      }
    }

    for (const m of householdMembers) {
      netMap.set(m.id, (paidMap.get(m.id) || 0) - (shareMap.get(m.id) || 0));
    }

    for (const st of openSettlements) {
      const amount = parseFloat(st.amount);
      if (isNaN(amount) || amount <= 0) continue;
      if (netMap.has(st.fromUserId)) {
        netMap.set(st.fromUserId, (netMap.get(st.fromUserId) || 0) + amount);
      }
      if (netMap.has(st.toUserId)) {
        netMap.set(st.toUserId, (netMap.get(st.toUserId) || 0) - amount);
      }
    }
  }

  const members: SplitMemberSummary[] = householdMembers.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    role: m.role,
    paidTotal: roundCents(paidMap.get(m.id) || 0),
    fairShare: roundCents(shareMap.get(m.id) || 0),
    netBalance: roundCents(netMap.get(m.id) || 0),
  }));

  const debtors = members
    .filter((m) => m.netBalance < -0.005)
    .map((m) => ({ userId: m.id, name: m.name, owed: -m.netBalance }))
    .sort((a, b) => b.owed - a.owed);

  const creditors = members
    .filter((m) => m.netBalance > 0.005)
    .map((m) => ({ userId: m.id, name: m.name, due: m.netBalance }))
    .sort((a, b) => b.due - a.due);

  const balances: SplitDebtEdge[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const transfer = Math.min(debtor.owed, creditor.due);
    const roundedTransfer = roundCents(transfer);

    if (roundedTransfer > 0) {
      balances.push({
        fromUserId: debtor.userId,
        fromUserName: debtor.name,
        toUserId: creditor.userId,
        toUserName: creditor.name,
        amount: roundedTransfer,
      });
    }

    debtor.owed -= transfer;
    creditor.due -= transfer;
    if (debtor.owed <= 0.005) i++;
    if (creditor.due <= 0.005) j++;
  }

  const unsettledTotal = roundCents(
    balances.reduce((acc, edge) => acc + edge.amount, 0)
  );

  return { members, balances, unsettledTotal };
}

export function normalizeMonthlyBurn(amount: number, billingCycle: string): number {
  if (billingCycle === "yearly") return amount / 12;
  if (billingCycle === "weekly") return (amount * 52) / 12;
  return amount;
}
