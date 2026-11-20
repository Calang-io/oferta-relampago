# Oferta Relâmpago

Tela 3 em `/oferta-relampago`, com os componentes, cores e classes compartilhados do projeto. Inclui gerenciamento, busca, filtro por status, paginação e prévia do cardápio digital. Não adiciona dependências.

## Regras de oferta

- O relógio usa `America/Fortaleza`, como a configuração. A janela inclui o instante inicial e exclui o fechamento. Janelas que atravessam a meia-noite mantêm o mesmo ciclo até o fechamento seguinte.
- Durante a janela, produtos com sobra prevista, estoque e desconto maior que zero ganham uma oferta automaticamente, mesmo quando o proprietário está em outra tela.
- O desconto é o limite por produto, ou o geral quando não houver limite individual, sempre limitado pelo teto geral. O preço é arredondado em centavos. Alterações salvas na configuração são respeitadas imediatamente.
- O lote inicial é o menor valor entre sobra prevista e estoque. Vendas posteriores consomem esse lote; o lote não é reposto por novas projeções ou aumento de produção durante a mesma janela. Produtos que passam a ser elegíveis podem ganhar sua primeira oferta durante a janela.
- A oferta encerra por esgotamento do lote, falta de estoque ou fechamento. O esgotamento fica registrado: repor ou corrigir a produção não reabre a oferta na mesma operação. Uma nova janela inicia um novo ciclo. A virada da data diária não repõe unidades de ofertas que atravessam a meia-noite.
- A pausa geral suspende a publicação, inclusive quando acionada antes da janela. A pausa individual suspende apenas aquele produto. Retomar a pausa geral preserva as pausas individuais. Pausas expiram no próximo ciclo.
- Editar o horário de fechamento ou a duração da janela preserva pausas, lotes consumidos e esgotamentos da operação atual. O novo horário passa a controlar a disponibilidade, sem criar outra operação apenas por ter sido editado.
- A prévia mostra somente ofertas ativas. A compra simulada vende uma unidade pelo preço promocional e atualiza estoque, pedido e risco juntos. Horário, pausa e estoque são revalidados na compra. Pedidos automáticos usam o preço da oferta quando ela está ativa; fora dela, usam o preço normal. Vendas normais também reduzem o saldo do lote para não oferecer unidades já vendidas.

## Integração e limites

`StoreContext` mantém as ofertas e o relógio, independentemente da rota aberta. A atualização de pedidos foi agrupada em uma operação pura para evitar duplicação de efeitos ao executar com React StrictMode. O cabeçalho reflete o estado real dos pedidos automáticos.

O projeto continua demonstrativo: a prévia é o cardápio local, sem publicação em serviços externos. Ofertas, pausas e pedidos ficam na memória da sessão e são reiniciados ao recarregar ou resetar a demonstração. As configurações continuam usando a persistência implementada na tela 1. A tela de resultados mantém os indicadores simulados da implementação existente; não é um relatório de vendas reais destas ofertas.

## Verificação

```sh
npm run build
npm run lint
node --experimental-strip-types src/features/flash-deals/__tests__/flash-deals-model.test.mjs
node --experimental-strip-types src/features/settings/__tests__/settings-model.test.mjs
```

Para conferir no navegador, execute `npm run dev -- --host 127.0.0.1` e abra `/oferta-relampago`. Em Configuração, ajuste o fechamento e a janela para incluir o horário atual de Fortaleza. Desligue os pedidos automáticos para inspecionar as quantidades sem vendas aleatórias; confira pausa individual e geral, a compra na prévia e o estoque na tela Itens em Risco. Fora da janela, a prévia não permite compras.
