# Estrutura do projeto

```text
oferta-relampago/
├── public/
├── src/
│   ├── assets/                 # Recursos estáticos
│   ├── components/
│   │   ├── layout/             # Cabeçalho, navegação e status da janela
│   │   └── ui/                 # Botões, modais, badges, inputs e cards
│   ├── context/                # Estado global da aplicação
│   ├── features/
│   │   ├── settings/           # Configurações da operação
│   │   ├── risk-items/         # Itens preparados e estimados
│   │   ├── flash-deals/        # Oferta relâmpago e estoque
│   │   └── results/            # Métricas e resultados
│   ├── hooks/                  # Hooks personalizados
│   ├── services/               # Cálculos e persistência de dados
│   ├── types/                  # Tipagens TypeScript
│   ├── utils/                  # Formatadores e utilitários
│   ├── App.tsx                 # Componente raiz
│   ├── index.css               # Configuração do Tailwind CSS
│   └── main.tsx                # Ponto de entrada
├── package.json
├── tsconfig.json
└── vite.config.ts              # Configuração do Vite
```

# Tecnologias

- React
- TypeScript
- Tailwind CSS
- Lucide React
