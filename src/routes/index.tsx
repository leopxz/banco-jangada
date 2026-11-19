import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, Loader2, MessageSquare, Plus, Trash2, Menu, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { BlockView, Suggestions } from "@/components/jaci/BlockView";
import { answer, SUGGESTIONS, type Block } from "@/lib/finance/jaci";
import { financeService } from "@/lib/finance/financeService";
import { FX_REFERENCE, REFERENCE_DATE } from "@/lib/finance/config";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Jaci · Assistente do Banco Jangada (demonstração)" },
      { name: "description", content: "Converse com a Jaci sobre contas, saldos e gastos fictícios da Plaid Sandbox." },
      { property: "og:title", content: "Jaci · Banco Jangada" },
      { property: "og:description", content: "Demonstração educacional de assistente financeira com dados fictícios." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ChatPage,
});

type Msg = { id: string; role: "user" | "jaci"; text?: string; blocks?: Block[]; error?: boolean };
type Thread = { id: string; title: string; updatedAt: number; messages: Msg[] };
const KEY = "jangada.threads.v1";
const uid = () => Math.random().toString(36).slice(2, 10);

function ChatPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showBrl, setShowBrl] = useState(true);
  const [menu, setMenu] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try { setThreads(JSON.parse(localStorage.getItem(KEY) ?? "[]")); } catch { /* ignora histórico corrompido */ }
    setShowBrl(localStorage.getItem("jangada.brl") !== "0");
    taRef.current?.focus();
  }, []);
  const persist = (t: Thread[]) => { setThreads(t); localStorage.setItem(KEY, JSON.stringify(t)); };
  const active = threads.find((t) => t.id === activeId);
  const messages = active?.messages ?? [];
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length, loading]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || loading) return;
    setInput("");
    const id = activeId ?? uid();
    const userMsg: Msg = { id: uid(), role: "user", text: q };
    const base = threads.find((t) => t.id === id) ?? { id, title: q.slice(0, 48), updatedAt: Date.now(), messages: [] };
    let list = [{ ...base, messages: [...base.messages, userMsg], updatedAt: Date.now() }, ...threads.filter((t) => t.id !== id)];
    persist(list); setActiveId(id); setLoading(true);
    let reply: Msg;
    try {
      const [accs, txs] = await Promise.all([financeService.getAccounts(), financeService.getTransactions()]);
      await new Promise((r) => setTimeout(r, 350));
      reply = { id: uid(), role: "jaci", blocks: answer(q, accs, txs) };
    } catch {
      reply = { id: uid(), role: "jaci", error: true, text: "Não consegui ler os dados de demonstração agora. Tente novamente em instantes." };
    }
    list = list.map((t) => (t.id === id ? { ...t, messages: [...t.messages, reply] } : t));
    persist(list); setLoading(false);
    setTimeout(() => taRef.current?.focus(), 0);
  }
  const newChat = () => { setActiveId(null); setMenu(false); taRef.current?.focus(); };
  const del = (id: string) => { persist(threads.filter((t) => t.id !== id)); if (id === activeId) setActiveId(null); };

  return (
    <div className="flex h-dvh flex-col bg-background font-sans">
      <div className="bg-accent px-4 py-1.5 text-center text-xs font-medium text-accent-foreground">
        Demonstração · Dados fictícios (Plaid Sandbox) · Referência: {REFERENCE_DATE}
      </div>
      <div className="relative flex min-h-0 flex-1">
        <aside className={`${menu ? "flex" : "hidden"} absolute inset-y-0 left-0 z-20 w-72 flex-col bg-sidebar text-sidebar-foreground md:static md:flex`}>
          <div className="flex items-center gap-3 p-4">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-sidebar-primary font-display text-xl font-semibold text-sidebar-primary-foreground">J</div>
            <div className="flex-1"><div className="font-display text-lg leading-tight">Banco Jangada</div><div className="text-xs opacity-70">Modo local · sem conexão a APIs</div></div>
            <button className="md:hidden" onClick={() => setMenu(false)} aria-label="Fechar menu"><X className="h-5 w-5" /></button>
          </div>
          <div className="px-3"><button onClick={newChat} className="flex w-full items-center gap-2 rounded-lg border border-sidebar-border px-3 py-2 text-sm hover:bg-sidebar-accent"><Plus className="h-4 w-4" /> Nova conversa</button></div>
          <div className="mt-4 px-4 text-xs uppercase tracking-wide opacity-60">Conversas anteriores</div>
          <nav className="mt-2 flex-1 space-y-0.5 overflow-y-auto px-2">
            {threads.length === 0 && <p className="px-2 text-sm opacity-60">Nenhuma ainda.</p>}
            {threads.map((t) => (
              <div key={t.id} className={`group flex items-center rounded-lg ${t.id === activeId ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/60"}`}>
                <button onClick={() => { setActiveId(t.id); setMenu(false); }} className="flex min-w-0 flex-1 items-center gap-2 px-2 py-2 text-left text-sm">
                  <MessageSquare className="h-4 w-4 shrink-0 opacity-60" /><span className="truncate">{t.title}</span>
                </button>
                <button onClick={() => del(t.id)} aria-label="Apagar conversa" className="p-2 opacity-0 group-hover:opacity-70 hover:opacity-100"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </nav>
          <p className="p-4 text-[11px] leading-snug opacity-60">Somente leitura. Marca fictícia; dados de teste da First Platypus Bank (Plaid Sandbox).</p>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center gap-3 border-b px-4 py-3">
            <button className="md:hidden" onClick={() => setMenu(true)} aria-label="Abrir menu"><Menu className="h-5 w-5" /></button>
            <div className="flex-1"><div className="font-display text-lg text-primary">Jaci</div><div className="text-xs text-muted-foreground">Assistente do Banco Jangada</div></div>
            <label className="flex items-center gap-2 text-sm">
              <span className="hidden sm:inline">Mostrar em reais</span><span className="sm:hidden">R$</span>
              <Switch checked={showBrl} onCheckedChange={(v) => { setShowBrl(v); localStorage.setItem("jangada.brl", v ? "1" : "0"); }} />
            </label>
          </header>

          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
              <JaciRow><p className="text-lg">Olá! Sou a Jaci, do Banco Jangada. O que você quer entender sobre suas finanças?</p>
                {messages.length === 0 && <Suggestions items={SUGGESTIONS} onSuggest={send} />}</JaciRow>
              {messages.map((m) => m.role === "user" ? (
                <div key={m.id} className="flex justify-end"><div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-primary-foreground">{m.text}</div></div>
              ) : (
                <JaciRow key={m.id}>
                  {m.error ? <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive">{m.text}</p>
                    : m.blocks?.map((b, i) => <BlockView key={i} b={b} showBrl={showBrl} onSuggest={send} />)}
                </JaciRow>
              ))}
              {loading && <JaciRow><span className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Jaci está calculando…</span></JaciRow>}
              <div ref={endRef} />
            </div>
          </div>

          <div className="border-t bg-background px-4 pb-3 pt-3">
            <form className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border bg-card p-2 shadow-sm focus-within:ring-2 focus-within:ring-ring" onSubmit={(e) => { e.preventDefault(); send(input); }}>
              <textarea ref={taRef} rows={1} value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
                placeholder="Pergunte à Jaci…" aria-label="Mensagem"
                className="max-h-40 min-h-[2.5rem] flex-1 resize-none bg-transparent px-2 py-2 outline-none placeholder:text-muted-foreground" />
              <button type="submit" disabled={!input.trim() || loading} aria-label="Enviar" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground disabled:opacity-40">
                <ArrowUp className="h-5 w-5" />
              </button>
            </form>
            {showBrl && <p className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-muted-foreground">
              Valores originais em USD. Conversão ilustrativa com taxa fixa: R$ {FX_REFERENCE.rate.toFixed(2).replace(".", ",")} = {FX_REFERENCE.source} de {FX_REFERENCE.date}. Não é cotação em tempo real.
            </p>}
          </div>
        </main>
      </div>
    </div>
  );
}

function JaciRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary font-display font-semibold text-primary-foreground">J</div>
      <div className="min-w-0 flex-1 space-y-3 pt-1">{children}</div>
    </div>
  );
}
