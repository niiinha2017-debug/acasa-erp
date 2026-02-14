import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from sqlalchemy import create_engine, text

app = FastAPI()

# Configuração de CORS para permitir acesso do seu Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONFIGURAÇÃO DO TOPO FIXA E SEGURA ---
# Se DATABASE_URL não existir (seu PC), usa a string padrão.
DB_URL = os.getenv(
    "DATABASE_URL", 
    "mysql+pymysql://acasa_user:gmgt33APCS!@localhost:3306/acasa_erp"
)
engine = create_engine(DB_URL)

# -----------------------------------------------------------
# ROTA 1: FLUXO DE CAIXA (O que você já tem)
# -----------------------------------------------------------
@app.get("/api/analytics/fluxo-caixa")
def get_fluxo():
    try:
        df_pagar = pd.read_sql("SELECT vencimento_em AS data, valor_original AS valor, descricao FROM contas_pagar", engine)
        df_receber = pd.read_sql("SELECT vencimento_em AS data, valor_original AS valor FROM contas_receber", engine)
        
        fluxo_total = []
        if df_pagar.empty and df_receber.empty:
            hoje = pd.Timestamp.now()
            fluxo_total.append({'Data': hoje, 'Valor': 0, 'Tipo': 'Início'})
        else:
            for _, item in df_pagar.iterrows():
                desc = str(item['descricao']).upper()
                if 'MDF' in desc or 'COMPRA' in desc:
                    data_primeira = pd.to_datetime(item['data']) + pd.DateOffset(months=2)
                    valor_parcela = float(item['valor']) / 6
                    for i in range(6):
                        fluxo_total.append({
                            'Data': data_primeira + pd.DateOffset(months=i),
                            'Valor': -(valor_parcela),
                            'Tipo': 'Saída MDF 6x'
                        })
                else:
                    fluxo_total.append({'Data': pd.to_datetime(item['data']), 'Valor': -float(item['valor']), 'Tipo': 'Fixo'})

            for _, item in df_receber.iterrows():
                fluxo_total.append({'Data': pd.to_datetime(item['data']), 'Valor': float(item['valor']), 'Tipo': 'Entrada'})

        df_final = pd.DataFrame(fluxo_total).sort_values('Data')
        df_final['Saldo_Caixa'] = df_final['Valor'].cumsum()
        df_final['Data'] = df_final['Data'].dt.strftime('%Y-%m-%d')
        
        return df_final.to_dict(orient='records')
    except Exception as e:
        return {"erro": str(e)}

# -----------------------------------------------------------
# ROTA 2: STATUS DE OBRAS
# -----------------------------------------------------------
@app.get("/api/analytics/status-obras")
def get_status_obras():
    try:
        with engine.connect() as conn:
            query = text("SELECT status_processo as status, COUNT(*) as total FROM obras GROUP BY status_processo")
            df = pd.read_sql(query, conn)
            
            if df.empty:
                return [
                    {"status": "Medição", "total": 2},
                    {"status": "Corte", "total": 5},
                    {"status": "Montagem", "total": 3}
                ]
            return df.to_dict(orient='records')
    except Exception as e:
        return {"erro": str(e)}

# -----------------------------------------------------------
# DASHBOARD: Resumo / KPIs (Python alimentando o dashboard)
# -----------------------------------------------------------
@app.get("/api/analytics/dashboard/resumo")
def get_dashboard_resumo():
    """KPIs gerais para o dashboard: contas a pagar/receber, totais do mês."""
    try:
        with engine.connect() as conn:
            # Contas a pagar (pendentes)
            r_pagar = pd.read_sql(text("""
                SELECT COALESCE(SUM(valor_original), 0) as total
                FROM contas_pagar WHERE pago_em IS NULL
            """), conn)
            total_a_pagar = float(r_pagar.iloc[0]["total"] or 0)

            # Contas a receber (pendentes)
            r_receber = pd.read_sql(text("""
                SELECT COALESCE(SUM(valor_original), 0) as total
                FROM contas_receber WHERE recebido_em IS NULL
            """), conn)
            total_a_receber = float(r_receber.iloc[0]["total"] or 0)

            # Contagem de clientes ativos (exemplo)
            try:
                r_clientes = pd.read_sql(text("SELECT COUNT(*) as total FROM clientes WHERE status = 'ATIVO'"), conn)
                clientes_ativos = int(r_clientes.iloc[0]["total"] or 0)
            except Exception:
                clientes_ativos = 0

        return {
            "total_a_pagar": round(total_a_pagar, 2),
            "total_a_receber": round(total_a_receber, 2),
            "clientes_ativos": clientes_ativos,
        }
    except Exception as e:
        return {"erro": str(e)}