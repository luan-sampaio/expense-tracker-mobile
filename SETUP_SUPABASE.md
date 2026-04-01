# Configuração do Supabase para Expense Tracker

## 1. Criar Tabela no Supabase

Execute o SQL abaixo no painel SQL do seu projeto Supabase:

```sql
-- Tabela de transações para o Expense Tracker
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  amount DECIMAL(10,2) NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
```

## 2. Configurar Variáveis de Ambiente

Verifique se seu arquivo `.env` contém:

```
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
```

## 3. Testar Integração

1. Inicie o app: `npm start`
2. Abra o modal e adicione uma transação
3. Verifique no console se a sincronização ocorre
4. Verifique no painel do Supabase se os dados aparecem

## 4. Funcionalidades Implementadas

- ✅ **Sync automático** ao adicionar/remover transações
- ✅ **Carregamento inicial** do Supabase ao abrir o app
- ✅ **Real-time updates** (opcional, via subscriptions)
- ✅ **Persistência local** como fallback

## 5. Troubleshooting

### Erros comuns:
- **CORS**: Verifique as configurações no Supabase
- **Permissões**: RLS está desabilitado para testes
- **Conexão**: Verifique URL e chaves no `.env`

### Logs úteis:
```javascript
// No console do navegador/dev tools
console.log('Real-time change received:', payload);
console.error('Error syncing transaction:', error);
```
