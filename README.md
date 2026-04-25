# 💸 Expense Tracker

![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Expo](https://img.shields.io/badge/Expo-SDK%2054-000020?style=for-the-badge&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-5.0-433E38?style=for-the-badge)

Aplicativo mobile de controle financeiro pessoal, construído com React Native e Expo. Permite registrar receitas e despesas com categorias, visualizar o saldo consolidado, acompanhar a distribuição de gastos por categoria e monitorar a saúde financeira com base na regra 50/30/20. A arquitetura é **local-first**: os dados são persistidos localmente com AsyncStorage e sincronizados com um backend Django Ninja separado quando disponível.

> 🔗 **Backend:** [expense-tracker-api](https://github.com/luan-sampaio/expense-tracker-api) — API REST construída com Django + Django Ninja

---

## ✨ Funcionalidades

### 💳 Gestão de Transações
- **CRUD completo:** criação, edição via swipe e remoção de transações com confirmação
- **Tipos:** suporte a receitas e despesas com diferenciação visual por cores
- **Categorias:** seletor visual com ícones para alimentação, transporte, moradia, lazer, salário e outros
- **Validação:** campos obrigatórios com mensagens de erro inline

### 📊 Dashboard e Análises
- **Saldo consolidado:** card premium com total de receitas e despesas do período
- **Regra 50/30/20:** widget que distribui os gastos entre essenciais, desejos e poupança com barras de progresso
- **Visão Geral:** gráfico de pizza com distribuição de despesas por categoria
- **Filtros por período:** semana, mês, ano ou todo o histórico

### 🔄 Sincronização
- **Local-first:** operações acontecem imediatamente no dispositivo, sem dependência de rede
- **Persistência:** dados salvos com AsyncStorage via Zustand Persist
- **Sync com backend:** ao iniciar o app, busca as transações da API Django; cada mutação é enviada ao backend em background
- **Resiliência:** timeout de 8s nas requisições; erros de sync não bloqueiam o uso do app

---

## 📂 Estrutura do Projeto

```text
expense-tracker/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx          # Configuração das abas (Início / Resumo)
│   │   ├── index.tsx            # Tela Início — saldo, botão, widget e lista
│   │   └── explore.tsx          # Tela Resumo — gráfico e analytics
│   ├── _layout.tsx              # Layout raiz com inicialização do sync
│   └── modal.tsx                # Modal para criar / editar transação
├── src/
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── BalanceHeader.tsx     # Card de saldo consolidado
│   │   │   ├── BudgetRuleWidget.tsx  # Widget da regra 50/30/20
│   │   │   └── TransactionItem.tsx   # Item de transação com swipe actions
│   │   └── ui/
│   │       ├── Button.tsx            # Botão com variantes (primary, secondary, danger, ghost)
│   │       ├── CategoryPicker.tsx    # Seletor horizontal de categorias
│   │       ├── Container.tsx         # Wrapper de layout com padding
│   │       ├── Input.tsx             # Campo de texto com label e erro
│   │       ├── LoadingSpinner.tsx    # Indicador de carregamento
│   │       ├── PeriodFilter.tsx      # Filtro de período (semana/mês/ano/tudo)
│   │       ├── Spacer.tsx            # Espaçador horizontal e vertical
│   │       └── Typography.tsx        # Sistema tipográfico com variantes
│   ├── hooks/
│   │   └── useFilteredTransactions.ts  # Hook para filtrar transações por período
│   ├── lib/
│   │   └── api.ts               # Cliente HTTP com timeout para o backend Django
│   ├── store/
│   │   └── useExpenseStore.ts   # Store Zustand com persistência e sync
│   ├── styles/
│   │   └── theme.ts             # Design system (cores, espaçamento, tipografia, sombras)
│   ├── types/
│   │   └── index.ts             # Interfaces Transaction, ExpenseState, TransactionType
│   └── utils/
│       └── validation.ts        # Funções puras de validação do formulário
├── constants/
│   └── theme.ts                 # Cores do tab bar (light/dark mode)
├── .env                         # EXPO_PUBLIC_API_URL
├── app.json
└── package.json
```

---

## 🛠️ Tecnologias Utilizadas

- **Linguagem:** TypeScript 5.9
- **Framework:** React Native 0.81 + Expo SDK 54
- **Navegação:** Expo Router v6 (file-based routing)
- **Estado Global:** Zustand v5 com middleware `persist`
- **Persistência Local:** AsyncStorage
- **Gráficos:** react-native-chart-kit + react-native-svg
- **Gestos:** react-native-gesture-handler (swipe to edit/delete)
- **Animações:** react-native-reanimated
- **Backend:** Django + Django Ninja (repositório separado)

---

## 💻 Pré-requisitos

- [Node.js 18+](https://nodejs.org/)
- [Expo Go](https://expo.dev/go) instalado no celular **ou** emulador Android/iOS configurado
- [Git](https://git-scm.com)
- Backend Django rodando (opcional — o app funciona offline sem ele)

---

## 🚀 Como executar o projeto

### 1. Clone o repositório

```bash
git clone https://github.com/luan-sampaio/expense-tracker.git
cd expense-tracker
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# URL base do backend Django Ninja
# Em emulador Android: http://10.0.2.2:8001/api
# Em celular físico: http://SEU_IP_LOCAL:8001/api
EXPO_PUBLIC_API_URL=http://192.168.x.x:8001/api
```

> Para descobrir seu IP local: `ip addr show | grep "inet " | grep -v 127`

### 4. Inicie o app

```bash
npx expo start -c
```

- Escaneie o QR code com o **Expo Go** no celular
- Ou pressione `a` para abrir no emulador Android (requer Android SDK)
- Ou pressione `w` para abrir no navegador

---

## 🔗 Integração com o Backend

O app se conecta automaticamente ao backend Django Ninja na inicialização. Caso o backend não esteja disponível, o app opera normalmente com os dados locais.

Para rodar o backend, consulte o repositório: [expense-tracker-api](https://github.com/luan-sampaio/expense-tracker-api)

```bash
# Com o backend rodando, a documentação interativa fica disponível em:
http://localhost:8001/api/docs
```

---

## 👨‍💻 Autor

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/luan-sampaio">
        <img src="https://avatars.githubusercontent.com/luan-sampaio" width="100px;" alt="Foto de Luan Sampaio no GitHub"/>
        <br>
        <sub>
          <b>Luan Sampaio</b>
        </sub>
      </a>
    </td>
  </tr>
</table>
