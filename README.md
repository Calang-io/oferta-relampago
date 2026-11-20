# Estrutura do projeto

oferta-relampago/
├── public/
├── src/
│   ├── assets/              # Imagens, logos e recursos estáticos
│   ├── components/
│   │   ├── layout/          # Header, barra de navegação e status da janela
│   │   └── ui/              # Componentes base (Botões, Modais, Badges, Inputs, Cards)
│   ├── context/             # Gerenciamento de estado global (loja, janela de oferta, pedidos)
│   ├── features/
│   │   ├── settings/        # [Tela 1] Configuração (fechamento, janela, desconto máx, preparo diário/histórico)
│   │   ├── risk-items/      # [Tela 2] Itens em Risco (preparado vs estimado, recálculo por pedido)
│   │   ├── flash-deals/     # [Tela 3] Oferta Relâmpago (cardápio digital, cronômetro, estoque limitado, pausa)
│   │   └── results/         # [Tela 4] Resultados (desperdício evitado, receita recuperada, itens com mais sobra)
│   ├── hooks/               # Custom hooks (ex: useCountdown, useLocalStorage, useRiskCalculator)
│   ├── services/            # Serviços de cálculo de risco, estimativa de vendas e persistência
│   ├── types/               # Interfaces TypeScript (produtos, ofertas, pedidos, métricas, configurações)
│   ├── utils/               # Formatadores (moeda BRL, data/hora) e utilitários matemáticos
│   ├── App.tsx              # Componente raiz
│   ├── index.css            # Importação do Tailwind CSS
│   └── main.tsx             # Entrypoint da aplicação
├── package.json
├── tsconfig.json
└── vite.config.ts           # Configuração do Vite com suporte ao Tailwind CSS

# Tecnologias

- React 
- Typescript
- TailwindCss
- LucideChart (pra ícones)