-- Tabela de transações para o Expense Tracker
-- IMPORTANTE: Se a tabela já existe, delete-a primeiro com: DROP TABLE IF EXISTS transactions;
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  amount NUMERIC(10,2) NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);

-- RLS (Row Level Security) - desabilitado por enquanto para testes
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;

-- Políticas de acesso (quando habilitar RLS)
-- CREATE POLICY "Users can view own transactions" ON transactions
--   FOR SELECT USING (auth.uid() = user_id);
--   
-- CREATE POLICY "Users can insert own transactions" ON transactions
--   FOR INSERT WITH CHECK (auth.uid() = user_id);
--   
-- CREATE POLICY "Users can update own transactions" ON transactions
--   FOR UPDATE USING (auth.uid() = user_id);
--   
-- CREATE POLICY "Users can delete own transactions" ON transactions
--   FOR DELETE USING (auth.uid() = user_id);
