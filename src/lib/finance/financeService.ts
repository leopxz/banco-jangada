// Camada de serviços substituível: na Etapa 2 troque apenas a fonte (Plaid via backend).
import { ACCOUNTS, TRANSACTIONS, SNAPSHOT_META, type Account, type Transaction } from "@/data/sandboxSnapshot";
export const financeService = {
  source: "local" as "local" | "plaid",
  meta: () => SNAPSHOT_META,
  getAccounts: async (): Promise<Account[]> => ACCOUNTS,
  getTransactions: async (): Promise<Transaction[]> => TRANSACTIONS,
};
export const CATEGORY_PT: Record<string, string> = {
  TRANSFER_OUT: "Transferências de saída", TRANSFER_IN: "Transferências de entrada",
  LOAN_PAYMENTS: "Pagamentos de empréstimos/dívidas", FOOD_AND_DRINK: "Alimentação e bebidas",
  TRANSPORTATION: "Transporte", TRAVEL: "Viagens", RENT_AND_UTILITIES: "Aluguel e contas",
  GENERAL_MERCHANDISE: "Mercadorias em geral", PERSONAL_CARE: "Cuidados pessoais",
};
export const SUBTYPE_PT: Record<string, string> = {
  checking: "Conta corrente", savings: "Poupança", cd: "Depósito a prazo (CD)", "credit card": "Cartão de crédito",
  "money market": "Mercado monetário", ira: "Aposentadoria (IRA)", "401k": "Aposentadoria (401k)",
  student: "Crédito estudantil", mortgage: "Crédito imobiliário", hsa: "Conta de saúde (HSA)",
  "cash management": "Gestão de caixa", auto: "Crédito de veículo", "home equity": "Crédito com garantia de imóvel",
};
export const NATURE_PT = { dinheiro: "Dinheiro", investimento: "Investimento", divida: "Dívida" } as const;
export const NON_CONSUMPTION = new Set(["TRANSFER_OUT", "LOAN_PAYMENTS"]);

const cents = (v: number) => Math.round(v * 100);
export const sum = (vals: number[]) => vals.reduce((a, v) => a + cents(v), 0) / 100;

export function totalsByNature(accs: Account[]) {
  const by = (k: string) => sum(accs.filter((a) => a.nature === k).map((a) => a.current));
  return { dinheiro: by("dinheiro"), investimento: by("investimento"), divida: by("divida") };
}
export function flowTotals(txs: Transaction[]) {
  const conf = txs.filter((t) => !t.pending);
  return {
    count: txs.length, confirmed: conf.length, pending: txs.length - conf.length,
    inflow: sum(conf.filter((t) => t.amount < 0).map((t) => -t.amount)),
    outflow: sum(conf.filter((t) => t.amount > 0).map((t) => t.amount)),
  };
}
export function outflowByCategory(txs: Transaction[]) {
  const m = new Map<string, number[]>();
  for (const t of txs) if (!t.pending && t.amount > 0) m.set(t.category, [...(m.get(t.category) ?? []), t.amount]);
  return [...m.entries()].map(([code, v]) => ({ code, label: CATEGORY_PT[code] ?? code, count: v.length, total: sum(v) }))
    .sort((a, b) => b.total - a.total);
}
