// Etapa 1: intenção por regras/palavras-chave. Sem IA. Todos os números vêm do código.
import type { Account, Transaction } from "@/data/sandboxSnapshot";
import { CATEGORY_PT, NATURE_PT, NON_CONSUMPTION, SUBTYPE_PT, flowTotals, outflowByCategory, sum, totalsByNature } from "./financeService";
import { dateBR } from "./format";

export type Cell = string | { usd: number; prefix?: string };
export type Block =
  | { type: "text"; text: string }
  | { type: "stats"; items: { label: string; value: Cell; hint?: string }[] }
  | { type: "table"; headers: string[]; rows: Cell[][] }
  | { type: "bars"; items: { label: string; value: number; count: number }[] }
  | { type: "suggestions"; items: string[] };

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const MONTHS = ["janeiro","fevereiro","marco","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
const CAT_KEYS: [RegExp, string][] = [
  [/aliment|comida|bebida|restaurante|lanche|cafe/, "FOOD_AND_DRINK"],
  [/transporte|uber|bicicleta/, "TRANSPORTATION"],
  [/viage|aere|voo/, "TRAVEL"],
  [/aluguel|contas de casa|utilidade/, "RENT_AND_UTILITIES"],
  [/mercadoria|compras gerais/, "GENERAL_MERCHANDISE"],
  [/cuidado|pessoal|escalada/, "PERSONAL_CARE"],
  [/transferencias? de entrada|juros/, "TRANSFER_IN"],
  [/transferencias? de saida/, "TRANSFER_OUT"],
  [/pagamentos? de (emprestimo|divida)/, "LOAN_PAYMENTS"],
];
const ACC_KEYS: [RegExp, string][] = [
  [/business|empresarial|cartao (de credito )?empresa/, "Plaid Business Credit Card"],
  [/home equity|garantia de imovel/, "Plaid Home Equity Line of Credit"],
  [/checking|conta corrente/, "Plaid Checking"],
  [/poupanca|saving/, "Plaid Saving"],
  [/\bcd\b|deposito a prazo/, "Plaid CD"],
  [/cartao|credit card/, "Plaid Credit Card"],
  [/money market|mercado monetario/, "Plaid Money Market"],
  [/\bira\b/, "Plaid IRA"], [/401k/, "Plaid 401k"],
  [/estudantil|student/, "Plaid Student Loan"],
  [/imobiliario|mortgage|hipoteca/, "Plaid Mortgage"],
  [/\bhsa\b|saude/, "Plaid HSA"],
  [/cash management|gestao de caixa/, "Plaid Cash Management"],
  [/veiculo|auto loan|carro/, "Plaid Auto Loan"],
];
export const SUGGESTIONS = ["Mostrar minhas contas","Consultar meus saldos","Ver minhas últimas transações","Quanto gastei com alimentação?","Gastos por categoria","Gastos de outubro","Resumir minhas movimentações"];

interface Filter { month?: number; account?: string; from?: string; to?: string }
function parseFilter(q: string): Filter {
  const f: Filter = {};
  const mi = MONTHS.findIndex((m) => q.includes(m));
  if (mi >= 0) f.month = mi + 1;
  for (const [re, name] of ACC_KEYS) if (re.test(q)) { f.account = name; break; }
  const d = [...q.matchAll(/(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/g)].map((m) => `${m[3] ?? "2026"}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`);
  if (d.length >= 2) { f.from = d[0] < d[1] ? d[0] : d[1]; f.to = d[0] < d[1] ? d[1] : d[0]; }
  return f;
}
function applyFilter(txs: Transaction[], f: Filter) {
  return txs.filter((t) => (!f.month || Number(t.date.slice(5, 7)) === f.month) && (!f.account || t.account === f.account) && (!f.from || (t.date >= f.from && t.date <= f.to!)));
}
function scope(f: Filter, txs: Transaction[]) {
  const parts: string[] = [];
  if (f.month) parts.push(`mês de ${["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"][f.month - 1]}`);
  else if (f.from) parts.push(`de ${dateBR(f.from)} a ${dateBR(f.to!)}`);
  else parts.push("período de 22/08/2026 a 19/11/2026");
  if (f.account) parts.push(`conta ${f.account}`);
  return `Analisei ${txs.length} ${txs.length === 1 ? "registro" : "registros"} (${parts.join(", ")}).`;
}
const txRows = (txs: Transaction[]): Cell[][] => txs.map((t) => [dateBR(t.date), t.description, t.account, CATEGORY_PT[t.category] ?? t.category, t.amount > 0 ? "Saída" : "Entrada", { usd: Math.abs(t.amount) }]);
const TX_HEAD = ["Data","Descrição","Conta","Categoria","Tipo","Valor"];
const nf = (v: number | null): Cell => (v === null ? "Não informado" : { usd: v });
const empty = (f: Filter): Block[] => [{ type: "text", text: "Não encontrei registros para esse filtro nos dados de demonstração (período de 22/08/2026 a 19/11/2026). Tente outro mês ou conta." }, { type: "suggestions", items: ["Gastos de outubro", "Ver minhas últimas transações"] }];

export function answer(input: string, accounts: Account[], txs: Transaction[]): Block[] {
  const q = norm(input);
  const f = parseFilter(q);
  const filtered = applyFilter(txs, f);

  if (/\b(pagar|pague|transferir|transfira|pix|enviar dinheiro|contratar|emprestimo novo|pedir emprestimo|boleto|investir|aplicar)\b/.test(q))
    return [{ type: "text", text: "Esta é uma demonstração **somente de leitura**: não faço pagamentos, transferências, Pix nem contratação de crédito. Posso ajudar a entender suas contas e gastos." }, { type: "suggestions", items: ["Consultar meus saldos", "Resumir minhas movimentações"] }];

  if (/saldo|patrimonio|quanto (eu )?tenho|divida|limite|investiment/.test(q)) {
    const t = totalsByNature(accounts);
    const list = f.account ? accounts.filter((a) => a.name === f.account) : accounts;
    return [
      { type: "text", text: "Saldos separados por natureza. **Não somo tudo como patrimônio**: em contas de dívida, o saldo atual é o quanto você deve, e em cartões e linhas de crédito o \"disponível\" é **limite de crédito**, não dinheiro." },
      ...(f.account ? [] : [{ type: "stats" as const, items: [
        { label: "Dinheiro", value: { usd: t.dinheiro }, hint: "7 contas de depósito" },
        { label: "Investimentos", value: { usd: t.investimento }, hint: "Não é dinheiro disponível" },
        { label: "Dívidas", value: { usd: t.divida }, hint: "Saldo devedor atual" },
      ] }]),
      { type: "table", headers: ["Conta","Natureza","Saldo atual","Disponível","Limite"], rows: list.map((a) => [a.name, NATURE_PT[a.nature], a.nature === "divida" ? { usd: a.current, prefix: "Devido: " } : { usd: a.current }, a.available === null ? "Não informado" : a.nature === "divida" ? { usd: a.available, prefix: "Limite: " } : { usd: a.available }, nf(a.limit)]) },
    ];
  }

  if (/\bcontas?\b/.test(q) && !/gast|transac|categoria/.test(q)) {
    return [
      { type: "text", text: `Encontrei **${accounts.length} contas** fictícias (moeda: USD).` },
      { type: "table", headers: ["Conta","Nome oficial","Tipo","Natureza","Moeda"], rows: accounts.map((a) => [a.name, a.officialName ?? "Não informado", SUBTYPE_PT[a.subtype] ?? a.subtype, NATURE_PT[a.nature], a.currency]) },
    ];
  }

  let cat: string | undefined;
  for (const [re, c] of CAT_KEYS) if (re.test(q)) { cat = c; break; }

  if (cat) {
    const list = filtered.filter((t) => t.category === cat && !t.pending);
    if (!list.length) return empty(f);
    const out = list.filter((t) => t.amount > 0), inn = list.filter((t) => t.amount < 0);
    const blocks: Block[] = [{ type: "text", text: `${scope(f, list)} Categoria **${CATEGORY_PT[cat]}**: ${out.length} saídas.` + (inn.length ? ` Também há ${inn.length} entradas (estornos/créditos) nessa categoria, mostradas à parte.` : "") + (NON_CONSUMPTION.has(cat) ? " Atenção: esta categoria é movimentação ou pagamento de dívida, **não consumo**." : "") },
      { type: "stats", items: [{ label: "Total de saídas", value: { usd: sum(out.map((t) => t.amount)) }, hint: `${out.length} registros` }, ...(inn.length ? [{ label: "Total de entradas", value: { usd: sum(inn.map((t) => -t.amount)) } as Cell, hint: `${inn.length} registros` }] : [])] },
      { type: "table", headers: TX_HEAD, rows: txRows(list) }];
    return blocks;
  }

  if (/categoria/.test(q)) {
    const cats = outflowByCategory(filtered);
    if (!cats.length) return empty(f);
    return [{ type: "text", text: `${scope(f, filtered)} Saídas confirmadas por categoria:` }, { type: "bars", items: cats.map((c) => ({ label: c.label, value: c.total, count: c.count })) },
      { type: "table", headers: ["Categoria","Registros","Total"], rows: cats.map((c) => [c.label, String(c.count), { usd: c.total }]) }];
  }

  if (/ultim|recent/.test(q)) {
    const list = [...filtered].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
    if (!list.length) return empty(f);
    return [{ type: "text", text: `As ${list.length} transações mais recentes${f.account ? ` da conta ${f.account}` : ""}. Valor positivo na fonte = saída; negativo = entrada.` }, { type: "table", headers: TX_HEAD, rows: txRows(list) }];
  }

  if (/resum|moviment|visao geral|balanco/.test(q)) {
    if (!filtered.length) return empty(f);
    const ft = flowTotals(filtered); const cats = outflowByCategory(filtered).slice(0, 3);
    return [{ type: "text", text: `${scope(f, filtered)} ${ft.confirmed} confirmados e ${ft.pending} pendentes.` },
      { type: "stats", items: [{ label: "Entradas", value: { usd: ft.inflow } }, { label: "Saídas", value: { usd: ft.outflow } }, { label: "Diferença", value: { usd: sum([ft.inflow, -ft.outflow]) }, hint: "Entradas − saídas" }] },
      { type: "table", headers: ["Maiores categorias de saída","Registros","Total"], rows: cats.map((c) => [c.label, String(c.count), { usd: c.total }]) },
    ];
  }

  if (/gast|gastei|despesa|consumo/.test(q)) {
    if (!filtered.length) return empty(f);
    const out = filtered.filter((t) => !t.pending && t.amount > 0);
    const cons = out.filter((t) => !NON_CONSUMPTION.has(t.category)); const mov = out.filter((t) => NON_CONSUMPTION.has(t.category));
    const cats = outflowByCategory(cons);
    return [{ type: "text", text: `${scope(f, filtered)} Separei **consumo** de **movimentações** (transferências de saída e pagamentos de dívidas), que não são gastos de consumo.` },
      { type: "stats", items: [{ label: "Consumo", value: { usd: sum(cons.map((t) => t.amount)) }, hint: `${cons.length} registros` }, { label: "Movimentações/dívidas", value: { usd: sum(mov.map((t) => t.amount)) }, hint: `${mov.length} registros` }, { label: "Total de saídas", value: { usd: sum(out.map((t) => t.amount)) }, hint: `${out.length} registros` }] },
      ...(cats.length ? [{ type: "bars" as const, items: cats.map((c) => ({ label: c.label, value: c.total, count: c.count })) }] : [])];
  }

  if (/transac|extrato|lancamento/.test(q) || f.month || f.account || f.from) {
    if (!filtered.length) return empty(f);
    const ft = flowTotals(filtered);
    return [{ type: "text", text: `${scope(f, filtered)}` }, { type: "stats", items: [{ label: "Entradas", value: { usd: ft.inflow } }, { label: "Saídas", value: { usd: ft.outflow } }] }, { type: "table", headers: TX_HEAD, rows: txRows([...filtered].sort((a, b) => b.date.localeCompare(a.date))) }];
  }

  return [{ type: "text", text: "Não consegui responder isso com os dados de demonstração. Eu entendo perguntas sobre **contas, saldos, transações, categorias de gasto e meses** (agosto a novembro de 2026)." }, { type: "suggestions", items: ["Consultar meus saldos", "Gastos por categoria", "Gastos de outubro"] }];
}
