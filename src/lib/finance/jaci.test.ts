import { describe, it, expect } from "vitest";
import { ACCOUNTS, TRANSACTIONS } from "@/data/sandboxSnapshot";
import { flowTotals, outflowByCategory, totalsByNature } from "./financeService";
import { usd } from "./format";
import { answer } from "./jaci";

describe("totais esperados", () => {
  it("fluxos", () => {
    const f = flowTotals(TRANSACTIONS);
    expect([f.count, f.confirmed, f.pending]).toEqual([48, 48, 0]);
    expect(usd(f.inflow)).toBe("US$ 1.512,66");
    expect(usd(f.outflow)).toBe("US$ 33.448,38");
  });
  it("categorias", () => {
    const c = Object.fromEntries(outflowByCategory(TRANSACTIONS).map((x) => [x.code, [x.count, x.total]]));
    expect(c).toEqual({ TRANSFER_OUT: [6, 20550], LOAN_PAYMENTS: [6, 6310.5], FOOD_AND_DRINK: [9, 1548.99], TRANSPORTATION: [9, 1535.19], TRAVEL: [3, 1500], RENT_AND_UTILITIES: [3, 1500], GENERAL_MERCHANDISE: [3, 268.2], PERSONAL_CARE: [3, 235.5] });
  });
  it("naturezas", () => {
    expect(totalsByNature(ACCOUNTS)).toEqual({ dinheiro: 62589, investimento: 23952.74, divida: 163705.89 });
  });
  it("operações de escrita são recusadas", () => {
    expect(JSON.stringify(answer("quero fazer um pix", ACCOUNTS, TRANSACTIONS))).toContain("somente de leitura");
  });
  it("gastos de outubro filtram o mês", () => {
    expect(JSON.stringify(answer("Gastos de outubro", ACCOUNTS, TRANSACTIONS))).toContain("Analisei 16 registros");
  });
});
