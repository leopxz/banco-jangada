# Especificação para o Lovable — Jaci, assistente do Banco Jangada

> Cole TODO o conteúdo abaixo da linha como uma única mensagem no Lovable.
> Primeiro no **modo Chat** (para tirar dúvidas); depois peça para construir.

---

## 1. Objetivo e contexto

Crie uma aplicação web chamada **Banco Jangada**, com um chat em que a assistente **Jaci** responde, em português simples, sobre contas, saldos e transações e ajuda a entender gastos.

É uma **demonstração educacional** de IA, MCP e APIs financeiras. O Banco Jangada é uma marca **fictícia**. Todos os registros bancários são **fictícios** e vieram da **Plaid Sandbox** (instituição de teste First Platypus Bank, `ins_109508`), consultada em 19/11/2026 pelos endpoints `POST /accounts/get` e `POST /transactions/get`, período de 22/08/2026 a 19/11/2026 (90 dias).

A documentação da integração brasileira foi estudada pelo MCP da Pluggy; os dados de teste vieram da Plaid. A Plaid **não representa o Open Finance brasileiro**: é só um laboratório. A aplicação **não** se conecta a nenhum MCP nem a nenhuma API nesta etapa.

## 2. Identidade e experiência

- Nome: **Banco Jangada**. Assistente: **Jaci**. Idioma: português do Brasil.
- Estilo de banco digital simples e acolhedor: **azul-marinho, branco e areia** (bege claro). Monograma **J**. Boa legibilidade, espaçamento confortável, layout responsivo.
- É um **aplicativo de conversa**, não uma landing page.
- Faixa fixa e sempre visível: **"Demonstração · Dados fictícios (Plaid Sandbox) · Referência: 19/11/2026"**.
- Saudação inicial: **"Olá! Sou a Jaci, do Banco Jangada. O que você quer entender sobre suas finanças?"**
- Sugestões clicáveis (enviam o pedido de verdade):
  - Mostrar minhas contas
  - Consultar meus saldos
  - Ver minhas últimas transações
  - Quanto gastei com alimentação?
  - Gastos por categoria
  - Gastos de outubro
  - Resumir minhas movimentações
- Campo de mensagem fixo, botão de envio, indicador de carregamento, mensagens de erro compreensíveis e histórico.
- **Enter envia; Shift+Enter quebra a linha.** Mensagens vazias não são enviadas.
- As respostas podem incluir cartões, tabelas e gráficos simples dentro da conversa, legíveis no celular.
- Botão **"Nova conversa"** e lista de conversas anteriores (guardadas no navegador).

## 3. O que a Jaci responde

1. Listar contas com tipo e moeda.
2. Saldo atual e disponível por conta.
3. **Separar dinheiro, investimentos, dívidas e limites** (ver regras).
4. Listar transações por **período** (mês ou intervalo de datas) e por **conta**.
5. As cinco transações mais recentes.
6. Gastos por **categoria**, com contagem de registros e total.
7. Resumo das movimentações (entradas, saídas, maiores categorias).
8. Responder apenas com base nos dados disponíveis.

**Não incluir** pagamentos, transferências, contratação de crédito nem nenhuma operação bancária de escrita. Se o usuário pedir, explicar que é uma demonstração somente de leitura.

### Como interpretar as perguntas (Etapa 1)

Nesta etapa **não usar nenhum modelo de IA nem API externa**. Identificar a intenção por regras e palavras-chave (contas, saldo, transações, categoria, nome do mês, nome da conta, "alimentação", "transporte", "viagem" etc.). **O código calcula todos os números**; o texto da resposta só apresenta esses resultados. Perguntas fora do escopo recebem uma explicação da limitação e 2 ou 3 sugestões válidas.

## 4. Regras dos dados e das respostas

- **Moeda original: USD.** Formatar como **"US$ 1.234,56"** (padrão brasileiro).
- **Conversão para reais (melhoria escolhida):** mostrar também o valor em reais, **sempre com a conversão declarada**, por exemplo: "US$ 110,00 (≈ R$ 621,50 · cotação de referência R$ 5,65 = PTAX de 13/11/2026, Banco Central)". A cotação fica numa constante única de configuração, com valor, data e fonte, e aparece num rodapé/aviso. Deixar claro que é **conversão ilustrativa com taxa fixa**, não cotação em tempo real. Um interruptor "Mostrar em reais" liga/desliga a conversão.
- **Natureza das contas:**
  - `dinheiro` (depository): saldo é dinheiro da pessoa.
  - `investimento` (investment): saldo é patrimônio investido; não é dinheiro disponível.
  - `divida` (credit, loan): **saldo atual é DÍVIDA**. Em cartão e linha de crédito, "disponível" é **limite de crédito**, não dinheiro.
  - **Nunca somar as 14 contas como patrimônio.** Mostrar totais separados: dinheiro, investimentos, dívidas.
- Campo ausente (`null`) aparece como **"Não informado"**.
- **Sinal das transações (regra da Plaid): valor positivo = saída; negativo = entrada.**
- Separar pendentes das confirmadas nos totais (neste conjunto: 0 pendentes).
- **Não tratar toda transferência como consumo.** TRANSFER_OUT e LOAN_PAYMENTS são movimentações/pagamento de dívida; mostrar "consumo" separado delas quando o usuário perguntar quanto gastou.
- Sempre informar **período e quantidade de registros** analisados.
- Preservar as descrições exatamente como vieram. Alguns nomes do Sandbox parecem contraditórios (ex.: "ACH Electronic CreditGUSTO PAY" vem como saída; "AUTOMATIC PAYMENT - THANK" é saída no cartão). Seguir o sinal do valor e a categoria, e **não** afirmar que algo é renda ou salário.
- Não inventar transações, categorias, recorrências ou conclusões. Não simular atualização em tempo real.

### Tradução das categorias (exibir em português, guardar o código original)

| Código | Exibir |
|---|---|
| TRANSFER_OUT | Transferências de saída |
| TRANSFER_IN | Transferências de entrada |
| LOAN_PAYMENTS | Pagamentos de empréstimos/dívidas |
| FOOD_AND_DRINK | Alimentação e bebidas |
| TRANSPORTATION | Transporte |
| TRAVEL | Viagens |
| RENT_AND_UTILITIES | Aluguel e contas |
| GENERAL_MERCHANDISE | Mercadorias em geral |
| PERSONAL_CARE | Cuidados pessoais |

### Tradução dos subtipos de conta

checking → Conta corrente · savings → Poupança · cd → Depósito a prazo (CD) · credit card → Cartão de crédito · money market → Mercado monetário · ira → Aposentadoria (IRA) · 401k → Aposentadoria (401k) · student → Crédito estudantil · mortgage → Crédito imobiliário · hsa → Conta de saúde (HSA) · cash management → Gestão de caixa · auto → Crédito de veículo · home equity → Crédito com garantia de imóvel

## 5. Etapa 1 — dados locais (usar exatamente estes registros)

Criar um arquivo de dados local (ex.: `src/data/sandboxSnapshot.ts`) com os registros abaixo, separado da interface por uma **camada de serviços substituível** (ex.: `financeService`), para que a Etapa 2 troque só a fonte dos dados.

### Contas (14) — `null` = Não informado

```
nome;nome_oficial;tipo;subtipo;natureza;saldo_atual;disponivel;limite;moeda
Plaid Checking;Plaid Gold Standard 0% Interest Checking;depository;checking;dinheiro;110;100;null;USD
Plaid Saving;Plaid Silver Standard 0.1% Interest Saving;depository;savings;dinheiro;210;200;null;USD
Plaid CD;Plaid Bronze Standard 0.2% Interest CD;depository;cd;dinheiro;1000;null;null;USD
Plaid Credit Card;Plaid Diamond 12.5% APR Interest Credit Card;credit;credit card;divida;410;null;2000;USD
Plaid Money Market;Plaid Platinum Standard 1.85% Interest Money Market;depository;money market;dinheiro;43200;43200;null;USD
Plaid IRA;null;investment;ira;investimento;320.76;null;null;USD
Plaid 401k;null;investment;401k;investimento;23631.98;null;null;USD
Plaid Student Loan;null;loan;student;divida;65262;null;null;USD
Plaid Mortgage;null;loan;mortgage;divida;56302.06;null;null;USD
Plaid HSA;Plaid Cares Health Savings Account;depository;hsa;dinheiro;6009;6009;null;USD
Plaid Cash Management;Plaid Growth Cash Management;depository;cash management;dinheiro;12060;12060;null;USD
Plaid Auto Loan;null;loan;auto;divida;23211.33;null;null;USD
Plaid Home Equity Line of Credit;null;loan;home equity;divida;13500.5;47647.5;61148;USD
Plaid Business Credit Card;Plaid Platinum Small Business Credit Card;credit;credit card;divida;5020;4980;10000;USD
```

### Transações (48) — valor positivo = saída; negativo = entrada

```
data;descricao;estabelecimento;valor;conta;pendente;categoria
2026-11-19;AUTOMATIC PAYMENT - THANK;null;2078.5;Plaid Credit Card;false;LOAN_PAYMENTS
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
2026-08-22;Tectra Inc;null;500;Plaid Credit Card;false;RENT_AND_UTILITIES
```

### Totais esperados (usar para conferir os cálculos)

- 48 transações, 48 confirmadas, 0 pendentes.
- Entradas confirmadas: **US$ 1.512,66**. Saídas confirmadas: **US$ 33.448,38**.
- Saídas por categoria: Transferências de saída 6 / US$ 20.550,00 · Pagamentos de empréstimos/dívidas 6 / US$ 6.310,50 · Alimentação e bebidas 9 / US$ 1.548,99 · Transporte 9 / US$ 1.535,19 · Viagens 3 / US$ 1.500,00 · Aluguel e contas 3 / US$ 1.500,00 · Mercadorias em geral 3 / US$ 268,20 · Cuidados pessoais 3 / US$ 235,50.
- Dinheiro (depository, saldo atual): US$ 62.589,00. Investimentos: US$ 23.952,74. Dívidas (saldo atual): US$ 163.705,89.

## 6. Etapa 2 — backend (NÃO implementar agora; só deixar preparado)

Fluxo futuro: usuário pergunta → backend interpreta a intenção → consulta a Plaid (`POST /accounts/get`, `POST /transactions/get` em `https://sandbox.plaid.com`, percorrendo todas as páginas) → código calcula → assistente explica → frontend apresenta. Tratar `PRODUCT_NOT_READY`, autenticação inválida e indisponibilidade com mensagens claras e no máximo 3 tentativas.

Segredos **apenas no backend**, pelos nomes `PLAID_CLIENT_ID`, `PLAID_SECRET`, `PLAID_ACCESS_TOKEN`. Nunca em variáveis públicas, no navegador ou no chat. **Não pedir credenciais agora.** Se alguma etapa exigir configuração adicional ou custo, explicar antes de ativar. Sem webhook nesta versão.

## 7. Critérios de aceite

- [ ] Marca Banco Jangada, assistente Jaci, chat como foco.
- [ ] Faixa "Demonstração · Dados fictícios" sempre visível.
- [ ] Desktop e celular utilizáveis.
- [ ] Envio por botão e Enter; Shift+Enter quebra linha; mensagens vazias bloqueadas.
- [ ] Sugestões clicáveis funcionando.
- [ ] Contas, saldos e transações claros; dinheiro, investimentos, dívidas e limites separados.
- [ ] Totais idênticos aos "Totais esperados".
- [ ] Gastos por categoria, por mês e por conta funcionando.
- [ ] Valores em USD com conversão para reais declarada (taxa, data e fonte visíveis) e interruptor.
- [ ] Perguntas sem resposta tratadas sem inventar números.
- [ ] Carregamento, erro e conjunto vazio previstos.
- [ ] Nova conversa e histórico funcionando.
- [ ] Nenhum indicador de "Conectado" a API; modo local claramente identificado.
- [ ] Nenhuma credencial no código ou no navegador; nenhuma operação de escrita.

**Instrução final:** comece pela Etapa 1. Ao entregar a prévia, explique objetivamente o que já funciona e o que falta para ativar a Etapa 2.
