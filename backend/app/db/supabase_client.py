import os
from supabase import create_client, Client

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def save_analysis(user_id: str, analysis_data: dict) -> dict:
    result = (
        supabase.table("resume_analyses")
        .insert({"user_id": user_id, **analysis_data})
        .execute()
    )
    return result.data[0] if result.data else {}


def get_user_analyses(user_id: str) -> list:
    result = (
        supabase.table("resume_analyses")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(10)
        .execute()
    )
    return result.data or []
