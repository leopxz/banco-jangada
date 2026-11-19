// Etapa 1: registros fictícios da Plaid Sandbox (First Platypus Bank, ins_109508), consultados em 19/11/2026.
export type Nature = "dinheiro" | "investimento" | "divida";
export interface Account {
  name: string; officialName: string | null; type: string; subtype: string; nature: Nature;
  current: number; available: number | null; limit: number | null; currency: "USD";
}
export interface Transaction {
  date: string; description: string; merchant: string | null; amount: number;
  account: string; pending: boolean; category: string;
}
export const SNAPSHOT_META = { institution: "First Platypus Bank (ins_109508)", fetchedAt: "2026-11-19", start: "2026-08-22", end: "2026-11-19" };

const ACC = `Plaid Checking;Plaid Gold Standard 0% Interest Checking;depository;checking;dinheiro;110;100;null
Plaid Saving;Plaid Silver Standard 0.1% Interest Saving;depository;savings;dinheiro;210;200;null
Plaid CD;Plaid Bronze Standard 0.2% Interest CD;depository;cd;dinheiro;1000;null;null
Plaid Credit Card;Plaid Diamond 12.5% APR Interest Credit Card;credit;credit card;divida;410;null;2000
Plaid Money Market;Plaid Platinum Standard 1.85% Interest Money Market;depository;money market;dinheiro;43200;43200;null
Plaid IRA;null;investment;ira;investimento;320.76;null;null
Plaid 401k;null;investment;401k;investimento;23631.98;null;null
Plaid Student Loan;null;loan;student;divida;65262;null;null
Plaid Mortgage;null;loan;mortgage;divida;56302.06;null;null
Plaid HSA;Plaid Cares Health Savings Account;depository;hsa;dinheiro;6009;6009;null
Plaid Cash Management;Plaid Growth Cash Management;depository;cash management;dinheiro;12060;12060;null
Plaid Auto Loan;null;loan;auto;divida;23211.33;null;null
Plaid Home Equity Line of Credit;null;loan;home equity;divida;13500.5;47647.5;61148
Plaid Business Credit Card;Plaid Platinum Small Business Credit Card;credit;credit card;divida;5020;4980;10000`;

const TX = `2026-11-19;AUTOMATIC PAYMENT - THANK;null;2078.5;Plaid Credit Card;false;LOAN_PAYMENTS
2026-11-19;KFC;KFC;500;Plaid Credit Card;false;FOOD_AND_DRINK
2026-11-19;Madison Bicycle Shop;Madison Bicycle Center;500;Plaid Credit Card;false;TRANSPORTATION
2026-11-10;CREDIT CARD 3333 PAYMENT *//;null;25;Plaid Saving;false;LOAN_PAYMENTS
2026-11-10;Uber 063015 SF**POOL**;Uber;5.4;Plaid Checking;false;TRANSPORTATION
2026-11-09;ACH Electronic CreditGUSTO PAY 123456;null;5850;Plaid Money Market;false;TRANSFER_OUT
2026-11-09;CD DEPOSIT .INITIAL.;null;1000;Plaid CD;false;TRANSFER_OUT
2026-11-08;Touchstone Climbing;Touchstone Climbing;78.5;Plaid Credit Card;false;PERSONAL_CARE
2026-11-08;United Airlines;United Airlines;-500;Plaid Checking;false;TRAVEL
2026-11-07;McDonald's;McDonald's;12;Plaid Checking;false;FOOD_AND_DRINK
2026-11-07;Starbucks;Starbucks;4.33;Plaid Checking;false;FOOD_AND_DRINK
2026-11-06;SparkFun;FUN;89.4;Plaid Checking;false;GENERAL_MERCHANDISE
2026-11-05;INTRST PYMNT;null;-4.22;Plaid Saving;false;TRANSFER_IN
2026-10-26;United Airlines;United Airlines;500;Plaid Credit Card;false;TRAVEL
2026-10-24;Uber 072515 SF**POOL**;Uber;6.33;Plaid Checking;false;TRANSPORTATION
2026-10-21;Tectra Inc;null;500;Plaid Credit Card;false;RENT_AND_UTILITIES
2026-10-20;AUTOMATIC PAYMENT - THANK;null;2078.5;Plaid Credit Card;false;LOAN_PAYMENTS
2026-10-20;KFC;KFC;500;Plaid Credit Card;false;FOOD_AND_DRINK
2026-10-20;Madison Bicycle Shop;Madison Bicycle Center;500;Plaid Credit Card;false;TRANSPORTATION
2026-10-11;CREDIT CARD 3333 PAYMENT *//;null;25;Plaid Saving;false;LOAN_PAYMENTS
2026-10-11;Uber 063015 SF**POOL**;Uber;5.4;Plaid Checking;false;TRANSPORTATION
2026-10-10;ACH Electronic CreditGUSTO PAY 123456;null;5850;Plaid Money Market;false;TRANSFER_OUT
2026-10-10;CD DEPOSIT .INITIAL.;null;1000;Plaid CD;false;TRANSFER_OUT
2026-10-09;Touchstone Climbing;Touchstone Climbing;78.5;Plaid Credit Card;false;PERSONAL_CARE
2026-10-09;United Airlines;United Airlines;-500;Plaid Checking;false;TRAVEL
2026-10-08;McDonald's;McDonald's;12;Plaid Checking;false;FOOD_AND_DRINK
2026-10-08;Starbucks;Starbucks;4.33;Plaid Checking;false;FOOD_AND_DRINK
2026-10-07;SparkFun;FUN;89.4;Plaid Checking;false;GENERAL_MERCHANDISE
2026-10-06;INTRST PYMNT;null;-4.22;Plaid Saving;false;TRANSFER_IN
2026-09-26;United Airlines;United Airlines;500;Plaid Credit Card;false;TRAVEL
2026-09-24;Uber 072515 SF**POOL**;Uber;6.33;Plaid Checking;false;TRANSPORTATION
2026-09-21;Tectra Inc;null;500;Plaid Credit Card;false;RENT_AND_UTILITIES
2026-09-20;AUTOMATIC PAYMENT - THANK;null;2078.5;Plaid Credit Card;false;LOAN_PAYMENTS
2026-09-20;KFC;KFC;500;Plaid Credit Card;false;FOOD_AND_DRINK
2026-09-20;Madison Bicycle Shop;Madison Bicycle Center;500;Plaid Credit Card;false;TRANSPORTATION
2026-09-11;CREDIT CARD 3333 PAYMENT *//;null;25;Plaid Saving;false;LOAN_PAYMENTS
2026-09-11;Uber 063015 SF**POOL**;Uber;5.4;Plaid Checking;false;TRANSPORTATION
2026-09-10;ACH Electronic CreditGUSTO PAY 123456;null;5850;Plaid Money Market;false;TRANSFER_OUT
2026-09-10;CD DEPOSIT .INITIAL.;null;1000;Plaid CD;false;TRANSFER_OUT
2026-09-09;Touchstone Climbing;Touchstone Climbing;78.5;Plaid Credit Card;false;PERSONAL_CARE
2026-09-09;United Airlines;United Airlines;-500;Plaid Checking;false;TRAVEL
2026-09-08;McDonald's;McDonald's;12;Plaid Checking;false;FOOD_AND_DRINK
2026-09-08;Starbucks;Starbucks;4.33;Plaid Checking;false;FOOD_AND_DRINK
2026-09-07;SparkFun;FUN;89.4;Plaid Checking;false;GENERAL_MERCHANDISE
2026-09-06;INTRST PYMNT;null;-4.22;Plaid Saving;false;TRANSFER_IN
2026-08-27;United Airlines;United Airlines;500;Plaid Credit Card;false;TRAVEL
2026-08-25;Uber 072515 SF**POOL**;Uber;6.33;Plaid Checking;false;TRANSPORTATION
2026-08-22;Tectra Inc;null;500;Plaid Credit Card;false;RENT_AND_UTILITIES`;

const n = (s: string) => (s === "null" ? null : s);
const num = (s: string) => (s === "null" ? null : Number(s));

export const ACCOUNTS: Account[] = ACC.split("\n").map((l) => {
  const [name, off, type, subtype, nature, cur, av, lim] = l.split(";") as string[] as [string,string,string,string,string,string,string,string];
  return { name, officialName: n(off), type, subtype, nature: nature as Nature, current: Number(cur), available: num(av), limit: num(lim), currency: "USD" };
});
export const TRANSACTIONS: Transaction[] = TX.split("\n").map((l) => {
  const [date, description, merchant, amount, account, pending, category] = l.split(";") as string[] as [string,string,string,string,string,string,string,string];
  return { date, description, merchant: n(merchant), amount: Number(amount), account, pending: pending === "true", category };
});
