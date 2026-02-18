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


# -----------------------------------------------------------
# DRE DE DESPESAS (por mês e categoria)
# -----------------------------------------------------------
@app.get("/api/analytics/dre-despesas")
def get_dre_despesas(inicio: str | None = None, fim: str | None = None):
    """Despesas (SAÍDA) por mês e categoria. Parâmetros: inicio, fim (YYYY-MM-DD)."""
    try:
        hoje = pd.Timestamp.now().normalize()
        dt_inicio = pd.to_datetime(inicio) if inicio else pd.Timestamp(year=hoje.year, month=1, day=1)
        dt_fim = pd.to_datetime(fim) if fim else hoje

        with engine.connect() as conn:
            query = text("""
                (
                    SELECT d.categoria, t.vencimento_em AS data, t.valor AS valor
                    FROM despesas d
                    INNER JOIN titulos_financeiros t ON t.despesa_id = d.id
                    WHERE t.vencimento_em BETWEEN :inicio AND :fim AND d.tipo_movimento = 'SAIDA'
                )
                UNION ALL
                (
                    SELECT d.categoria, d.data_vencimento AS data, d.valor_total AS valor
                    FROM despesas d
                    LEFT JOIN titulos_financeiros t ON t.despesa_id = d.id
                    WHERE t.id IS NULL AND d.data_vencimento BETWEEN :inicio AND :fim AND d.tipo_movimento = 'SAIDA'
                )
            """)
            df = pd.read_sql(query, conn, params={"inicio": dt_inicio, "fim": dt_fim})

        if df.empty:
            return []

        df["data"] = pd.to_datetime(df["data"])
        df["mes"] = df["data"].dt.to_period("M").astype(str)
        df["categoria"] = df["categoria"].astype(str).str.upper()
        agrupado = df.groupby(["mes", "categoria"], as_index=False)["valor"].sum().rename(columns={"valor": "total"})
        agrupado = agrupado.sort_values(["mes", "categoria"])
        return agrupado.to_dict(orient="records")
    except Exception as e:
        return {"erro": str(e)}