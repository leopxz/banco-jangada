import { FX_REFERENCE } from "./config";
const nf = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const usd = (v: number) => `${v < 0 ? "-" : ""}US$ ${nf.format(Math.abs(v))}`;
export const brl = (v: number) => `${v < 0 ? "-" : ""}R$ ${nf.format(Math.abs(v * FX_REFERENCE.rate))}`;
export const money = (v: number, showBrl: boolean) => (showBrl ? `${usd(v)} (≈ ${brl(v)})` : usd(v));
export const dateBR = (iso: string) => iso.split("-").reverse().join("/");
