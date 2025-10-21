"""
API routes for AI constraint parsing
Endpoints:
  - POST /api/constraints/parse - Parse natural language constraint
  - GET /api/constraints/health - Health check for OpenAI connection
"""

import os
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from config import logger
from utils import get_supabase_client
from services.openai_constraint_service import parse_natural_language_constraint
from models import AIConstraint

router = APIRouter(prefix="/api/constraints", tags=["constraints"])


class ParseConstraintRequest(BaseModel):
    """Request to parse a natural language constraint"""
    text: str = Field(description="Natural language constraint in Swedish")
    department: Optional[str] = Field(default=None, description="Filter employees by department")
    context_date: Optional[str] = Field(default=None, description="Context date for relative parsing (YYYY-MM-DD)")


class ParseConstraintResponse(BaseModel):
    """Response from constraint parsing"""
    success: bool
    constraint: Optional[AIConstraint] = None
    message: str
    reason: Optional[str] = None


@router.post("/parse", response_model=ParseConstraintResponse)
async def parse_constraint(request: ParseConstraintRequest):
    """
    Parse a natural language scheduling constraint using OpenAI GPT-4
    
    Example Swedish inputs:
    - "Charlotte ska inte jobba natt 15 november"
    - "Erik är ledig 20-25 december"
    - "Anna föredrar att inte jobba kvällar nästa vecka"
    """
    try:
        # Validate OpenAI API key
        if not os.getenv("OPENAI_API_KEY"):
            raise HTTPException(
                status_code=500,
                detail="OpenAI API key not configured. Add OPENAI_API_KEY to .env file"
            )
        
        # Fetch employees from database
        supabase = get_supabase_client()
        employees_response = supabase.table("employees").select("id, first_name, last_name, department").execute()
        employees = employees_response.data
        
        # Filter by department if specified
        if request.department:
            employees = [e for e in employees if e.get("department") == request.department]
        
        logger.info(f"🤖 Parsing constraint: '{request.text}' with {len(employees)} employees")
        
        # Parse using OpenAI
        result = parse_natural_language_constraint(
            user_input=request.text,
            employees=employees,
            context_date=request.context_date or datetime.now().strftime("%Y-%m-%d")
        )
        
        if result["success"]:
            # Convert to AIConstraint model
            constraint_data = result["constraint"]
            constraint = AIConstraint(**constraint_data)
            
            return ParseConstraintResponse(
                success=True,
                constraint=constraint,
                message=result["message"],
                reason=result.get("reason")
            )
        else:
            return ParseConstraintResponse(
                success=False,
                constraint=None,
                message=result["message"],
                reason=result.get("reason")
            )
            
    except Exception as e:
        logger.error(f"Error parsing constraint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Constraint parsing failed: {str(e)}")


@router.get("/health")
async def health_check():
    """
    Health check for OpenAI constraint parsing service
    Verifies API key is configured
    """
    openai_key = os.getenv("OPENAI_API_KEY")
    openai_model = os.getenv("OPENAI_MODEL", "gpt-4o")
    
    # Debug: Check all environment variables (without exposing values)
    env_vars_present = {
        "OPENAI_API_KEY": "OPENAI_API_KEY" in os.environ,
        "OPENAI_MODEL": "OPENAI_MODEL" in os.environ,
        "SUPABASE_URL": "SUPABASE_URL" in os.environ,
        "SUPABASE_KEY": "SUPABASE_KEY" in os.environ,
    }
    
    # If key exists, show first/last 4 chars for verification
    key_preview = None
    if openai_key:
        key_preview = f"{openai_key[:7]}...{openai_key[-4:]}"
    
    return {
        "status": "healthy" if openai_key else "unhealthy",
        "openai_configured": bool(openai_key),
        "openai_model": openai_model,
        "key_preview": key_preview,
        "env_vars_present": env_vars_present,
        "features": ["swedish_language", "function_calling", "date_parsing"]
    }
