"""
consulta_plaid.py
-----------------
Lê contas, saldos e transações do Plaid Sandbox e salva um JSON limpo
(sem credenciais, sem token, sem IDs internos) em dados/sandbox_snapshot.json.

Esse JSON serve para:
  1. anexar no Claude Desktop e pedir as tabelas e os 3 padrões de gasto;
  2. virar a base de dados local do chat no Lovable (Etapa 1).

Sem dependências externas: só a biblioteca padrão do Python 3.

Uso (rodar a partir da pasta raiz do projeto):
  python scripts/consulta_plaid.py                 -> usa PLAID_ACCESS_TOKEN do .env
  python scripts/consulta_plaid.py --criar-item    -> cria um Item novo (First Platypus Bank)
                                                      e grava o token no .env, sem exibi-lo
  python scripts/consulta_plaid.py --dias 60       -> muda o período (padrão: 90 dias)

Regras importantes da Plaid:
  - Valor de transação POSITIVO = saída de dinheiro; NEGATIVO = entrada.
  - Em cartão e empréstimo, o saldo atual é DÍVIDA, e "disponível" é limite, não dinheiro.
"""

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
from collections import defaultdict
from datetime import date, datetime, timedelta
from pathlib import Path

BASE_URL = "https://sandbox.plaid.com"  # único ambiente permitido neste projeto
INSTITUICAO_PADRAO = "ins_109508"       # First Platypus Bank (Sandbox)

RAIZ = Path(__file__).resolve().parent.parent
ARQ_ENV = RAIZ / ".env"
ARQ_SAIDA = RAIZ / "dados" / "sandbox_snapshot.json"

NATUREZA_POR_TIPO = {
    "depository": "dinheiro",       # corrente, poupança, CD, money market...
    "credit": "divida",             # cartões e linhas de crédito
    "loan": "divida",               # financiamentos e empréstimos
    "investment": "investimento",   # IRA, 401k, corretora...
}


class ErroPlaid(Exception):
    def __init__(self, codigo, mensagem):
        super().__init__(f"{codigo}: {mensagem}")
        self.codigo = codigo


# ---------------------------------------------------------------- .env

def ler_env(caminho):
    valores = {}
    if not caminho.exists():
        return valores
    for linha in caminho.read_text(encoding="utf-8").splitlines():
        linha = linha.strip()
        if not linha or linha.startswith("#") or "=" not in linha:
            continue
        chave, valor = linha.split("=", 1)
        valores[chave.strip()] = valor.strip().strip('"').strip("'")
    return valores


def gravar_no_env(caminho, chave, valor):
    linhas = caminho.read_text(encoding="utf-8").splitlines() if caminho.exists() else []
    linhas = [l for l in linhas if not l.strip().startswith(f"{chave}=")]
    linhas.append(f"{chave}={valor}")
    caminho.write_text("\n".join(linhas) + "\n", encoding="utf-8")


# ---------------------------------------------------------------- HTTP

def post(endpoint, corpo):
    requisicao = urllib.request.Request(
        BASE_URL + endpoint,
        data=json.dumps(corpo).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(requisicao, timeout=60) as resposta:
            return json.loads(resposta.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        try:
            erro = json.loads(e.read().decode("utf-8"))
        except Exception:
            raise ErroPlaid(f"HTTP_{e.code}", "resposta sem detalhes") from None
        raise ErroPlaid(erro.get("error_code", f"HTTP_{e.code}"),
                        erro.get("error_message", "")) from None
    except urllib.error.URLError as e:
        raise ErroPlaid("FALHA_DE_REDE", str(e.reason)) from None


def post_com_espera(endpoint, corpo, tentativas=3, espera=10):
    """Repete só quando a Plaid responde PRODUCT_NOT_READY (máx. 3 tentativas)."""
    for n in range(1, tentativas + 1):
        try:
            return post(endpoint, corpo)
        except ErroPlaid as e:
            if e.codigo != "PRODUCT_NOT_READY" or n == tentativas:
                raise
            print(f"  Dados ainda não prontos (tentativa {n}/{tentativas}). Aguardando {espera}s...")
            time.sleep(espera)


# ---------------------------------------------------------------- Plaid

def criar_item(cred):
    publico = post("/sandbox/public_token/create", {
        **cred,
        "institution_id": INSTITUICAO_PADRAO,
        "initial_products": ["transactions"],
    })
    troca = post("/item/public_token/exchange", {**cred, "public_token": publico["public_token"]})
    return troca["access_token"]


def buscar_contas(cred, token):
    resposta = post_com_espera("/accounts/get", {**cred, "access_token": token})
    return resposta["accounts"], resposta.get("item", {}).get("institution_id")


def buscar_transacoes(cred, token, inicio, fim):
    todas, offset, total = [], 0, None
    while total is None or offset < total:
        resposta = post_com_espera("/transactions/get", {
            **cred,
            "access_token": token,
            "start_date": inicio.isoformat(),
            "end_date": fim.isoformat(),
            "options": {"count": 500, "offset": offset},
        })
        total = resposta["total_transactions"]
        lote = resposta["transactions"]
        todas.extend(lote)
        offset += len(lote)
        if not lote:
            break
    return todas, total


# ---------------------------------------------------------------- limpeza

def limpar_contas(contas):
    limpas, nome_por_id = [], {}
    for c in contas:
        saldos = c.get("balances", {})
        nome_por_id[c["account_id"]] = c.get("name")
        limpas.append({
            "nome": c.get("name"),
            "nome_oficial": c.get("official_name"),
            "tipo": c.get("type"),
            "subtipo": c.get("subtype"),
            "natureza": NATUREZA_POR_TIPO.get(c.get("type"), "outro"),
            "saldo_atual": saldos.get("current"),
            "disponivel": saldos.get("available"),
            "limite": saldos.get("limit"),
            "moeda": saldos.get("iso_currency_code") or saldos.get("unofficial_currency_code"),
        })
    return limpas, nome_por_id


def limpar_transacoes(transacoes, nome_por_id):
    limpas = []
    for t in transacoes:
        valor = t.get("amount")
        categoria = (t.get("personal_finance_category") or {}).get("primary")
        limpas.append({
            "data": t.get("date"),
            "descricao": t.get("name"),
            "estabelecimento": t.get("merchant_name"),
            "valor": valor,
            "movimento": "saida" if valor is not None and valor > 0 else "entrada",
            "conta": nome_por_id.get(t.get("account_id"), "Não informado"),
            "pendente": bool(t.get("pending")),
            "categoria": categoria or "Não informado",
            "moeda": t.get("iso_currency_code") or t.get("unofficial_currency_code"),
        })
    limpas.sort(key=lambda x: x["data"] or "", reverse=True)
    return limpas


def resumir(transacoes):
    confirmadas = [t for t in transacoes if not t["pendente"] and t["valor"] is not None]
    por_categoria = defaultdict(lambda: {"registros": 0, "saidas": 0.0})
    for t in confirmadas:
        if t["valor"] > 0:
            por_categoria[t["categoria"]]["registros"] += 1
            por_categoria[t["categoria"]]["saidas"] += t["valor"]
    categorias = sorted(
        ({"categoria": k, "registros": v["registros"], "saidas": round(v["saidas"], 2)}
         for k, v in por_categoria.items()),
        key=lambda x: x["saidas"], reverse=True,
    )
    return {
        "total_registros": len(transacoes),
        "confirmadas": len(confirmadas),
        "pendentes": len(transacoes) - len(confirmadas),
        "entradas_confirmadas": round(sum(-t["valor"] for t in confirmadas if t["valor"] < 0), 2),
        "saidas_confirmadas": round(sum(t["valor"] for t in confirmadas if t["valor"] > 0), 2),
        "saidas_por_categoria": categorias,
    }


# ---------------------------------------------------------------- main

def main():
    parser = argparse.ArgumentParser(description="Consulta o Plaid Sandbox e salva um JSON limpo.")
    parser.add_argument("--criar-item", action="store_true",
                        help="cria um Item novo no First Platypus Bank e grava o token no .env")
    parser.add_argument("--dias", type=int, default=90, help="período em dias, incluindo hoje (padrão: 90)")
    args = parser.parse_args()

    env = ler_env(ARQ_ENV)
    client_id = env.get("PLAID_CLIENT_ID") or os.environ.get("PLAID_CLIENT_ID")
    secret = env.get("PLAID_SECRET") or os.environ.get("PLAID_SECRET")
    if not client_id or not secret:
        sys.exit(f"Faltam PLAID_CLIENT_ID e/ou PLAID_SECRET no arquivo {ARQ_ENV}. Veja o .env.example.")
    cred = {"client_id": client_id, "secret": secret}

    try:
        if args.criar_item:
            print("Criando Item de Sandbox (First Platypus Bank, produto transactions)...")
            token = criar_item(cred)
            gravar_no_env(ARQ_ENV, "PLAID_ACCESS_TOKEN", token)
            print("  Item criado. Token gravado no .env (não exibido).")
        else:
            token = env.get("PLAID_ACCESS_TOKEN") or os.environ.get("PLAID_ACCESS_TOKEN")
            if not token:
                sys.exit("Falta PLAID_ACCESS_TOKEN no .env. Copie o token gerado pelo MCP no Claude Desktop "
                         "ou rode com --criar-item.")

        fim = date.today()
        inicio = fim - timedelta(days=args.dias - 1)

        print("Consultando /accounts/get ...")
        contas_brutas, instituicao = buscar_contas(cred, token)
        print(f"Consultando /transactions/get ({inicio:%d/%m/%Y} a {fim:%d/%m/%Y}) ...")
        transacoes_brutas, total_api = buscar_transacoes(cred, token, inicio, fim)
    except ErroPlaid as e:
        sys.exit(f"Erro da Plaid -> {e}")

    contas, nome_por_id = limpar_contas(contas_brutas)
    transacoes = limpar_transacoes(transacoes_brutas, nome_por_id)

    snapshot = {
        "aviso": "DADOS FICTÍCIOS - Plaid Sandbox. Não representam pessoa nem banco real.",
        "gerado_em": datetime.now().isoformat(timespec="seconds"),
        "fonte": {
            "ambiente": BASE_URL,
            "endpoints": ["POST /accounts/get", "POST /transactions/get"],
            "instituicao_id": instituicao or "Não informado",
        },
        "regras": {
            "sinal_transacao": "positivo = saída; negativo = entrada",
            "natureza_divida": "em cartão e empréstimo, saldo_atual é dívida e disponivel é limite",
        },
        "periodo": {"inicio": inicio.isoformat(), "fim": fim.isoformat(), "dias": args.dias},
        "contas": contas,
        "transacoes": transacoes,
        "resumo": {**resumir(transacoes), "total_informado_pela_api": total_api},
    }

    ARQ_SAIDA.parent.mkdir(parents=True, exist_ok=True)
    ARQ_SAIDA.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2), encoding="utf-8")

    r = snapshot["resumo"]
    print("\nConcluído (dados fictícios):")
    print(f"  Instituição:  {snapshot['fonte']['instituicao_id']}")
    print(f"  Contas:       {len(contas)}")
    print(f"  Transações:   {r['total_registros']} (API informou {total_api}) "
          f"| confirmadas {r['confirmadas']} | pendentes {r['pendentes']}")
    print(f"  Arquivo:      {ARQ_SAIDA.relative_to(RAIZ)}")


if __name__ == "__main__":
    main()
