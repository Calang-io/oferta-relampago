# Configuração da operação

Tela integrada em `/configuracao`, usando a paleta e os componentes já existentes: `surface-*`, `brand-*`, `card-surface`, `panel-surface`, `btn-primary`, `btn-secondary`, `Badge` e `Pagination`. O CSS local só complementa layout responsivo e acessibilidade. Não cria navegação global, outra marca ou outro tema.

## Integração autorizada

- `App.tsx`: import e rota de `SettingsPage`.
- `StoreContext.tsx`: leitura/salvamento das configurações, confirmação da produção, uso da média sem registro diário e recálculo com `calculateRisk`.
- Fontes e testes da funcionalidade ficam em `features/settings`. Nenhum arquivo das outras telas ou dos componentes compartilhados foi modificado.

## Regras

`config` mantém o contrato anterior (`closingTime`, `offerWindowHours`, `maxDiscountPercentage`) e acrescenta `maxDiscountByItem`. O limite geral é o teto da loja e o valor usado por produtos sem limite individual. Um limite individual não pode ultrapassar o teto. Salvar não publica ofertas nem muda preços. A tela de ofertas poderá consumir `config.maxDiscountByItem[id] ?? config.maxDiscountPercentage`.

`confirmProduction` recebe o total preparado de todos os produtos. O registro tem data e horário de confirmação. Zero é válido quando o item não tem vendas; o total não pode ser inferior ao que já foi vendido. A confirmação atualiza `prepared`, estoque, sobra, valor em risco e classificação usando o cálculo compartilhado da base. Busca e paginação preservam os rascunhos. Confirmação abrange todos os produtos, inclusive outras páginas.

Sem confirmação válida para hoje, a quantidade usa a média arredondada de sete dias de vendas. `demo-history.ts` contém um histórico **fictício e explícito**, com IDs do catálogo simulado existente. Não se usa `prepared` como se fosse histórico de vendas. Ausência de histórico aparece como “Sem histórico” e exige entrada manual; o contexto preserva a quantidade já disponível no item até a entrada, sem chamá-la de média.

A data segue `America/Fortaleza`, verificada a cada 15 segundos e ao retornar à janela. Na troca de dia, confirmações anteriores expiram e os pedidos/vendas da simulação diária são reiniciados. A simulação de pedidos existente continua ativa. Reiniciar os dados de demonstração preserva os ajustes e a produção confirmada do dia.

## Persistência e limites

Chave local: `oferta-relampago:demo-store:settings:v1`. Salvar só comunica sucesso depois de gravar no navegador; falhas preservam os rascunhos. O snapshot valida conteúdo antes de carregar. O armazenamento representa a única loja demonstrativa atual, sem sincronização entre dispositivos/abas.

O aplicativo ainda não usa uma API real. Na integração CW, substituir catálogo e histórico simulados, vincular persistência à loja autenticada e gravar no backend. Não colocar segredos em variáveis `VITE_*`. Os dados das outras telas continuam sendo simulações, conforme a base recebida.

## Executar e verificar

```sh
npm ci
npm run dev
npm run build
npm run lint
node --experimental-strip-types --test src/features/settings/__tests__/settings-model.test.mjs
```

Abrir `http://127.0.0.1:5173/configuracao`. Os testes cobrem intervalo após meia-noite, data, média, expiração, zero, recálculo de risco, quantidades, limites de desconto e armazenamento inválido.
