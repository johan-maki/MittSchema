"""
OpenAI GPT-4 service for parsing natural language constraints in Swedish
Supports: hard blocks, soft preferences, Swedish dates, weekdays, and shift types
"""

import os
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from dateutil import parser as date_parser
import re

from openai import OpenAI
from config import logger

# OpenAI client will be initialized lazily
_client = None

def get_openai_client():
    """Get or initialize OpenAI client"""
    global _client
    if _client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable not set")
        _client = OpenAI(api_key=api_key)
    return _client

MODEL = os.getenv("OPENAI_MODEL", "gpt-4o")

# Swedish month and weekday mappings
SWEDISH_MONTHS = {
    "januari": 1, "februari": 2, "mars": 3, "april": 4,
    "maj": 5, "juni": 6, "juli": 7, "augusti": 8,
    "september": 9, "oktober": 10, "november": 11, "december": 12
}

SWEDISH_WEEKDAYS = {
    "måndag": 0, "tisdag": 1, "onsdag": 2, "torsdag": 3,
    "fredag": 4, "lördag": 5, "söndag": 6
}

SHIFT_TYPE_MAPPINGS = {
    "dag": "day",
    "kväll": "evening", 
    "kvällspass": "evening",
    "natt": "night",
    "nattpass": "night",
    "day": "day",
    "evening": "evening",
    "night": "night"
}


class OpenAIConstraintParser:
    """Parse natural language scheduling constraints using OpenAI GPT-4 function calling"""
    
    def __init__(self):
        self.conversation_history = []
        
    def parse_constraint(
        self,
        user_input: str,
        employees: List[Dict[str, Any]],
        context_date: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Parse a natural language constraint using OpenAI GPT-4 function calling
        
        Args:
            user_input: Natural language constraint in Swedish
            employees: List of employee dicts with 'id', 'name', 'department'
            context_date: ISO date string for relative date parsing (default: today)
            
        Returns:
            Dict with constraint details or error message
        """
        try:
            # Prepare employee context
            employee_names = [emp.get("name", emp.get("full_name", "")) for emp in employees]
            employee_list_str = ", ".join(employee_names[:10])  # Limit to first 10
            
            # System message with Swedish support
            system_message = f"""Du är en AI-assistent som hjälper till att tolka schema-begränsningar på svenska.

Tillgängliga anställda: {employee_list_str}

Dagens datum: {context_date or datetime.now().strftime('%Y-%m-%d')}

Du kan hantera:
- Hårda blockeringar ("ska inte jobba", "kan inte jobba", "ledig", "semester")
- Mjuka preferenser ("föredrar inte", "helst inte", "vill undvika")
- Svenska månadnamn (januari, februari, mars, etc.)
- Svenska veckodagar (måndag, tisdag, onsdag, etc.)
- Relativa datum ("nästa vecka", "i morgon", "om två veckor")
- Pass-typer: dag, kväll, natt

Tolka användarens begäran och anropa rätt funktion."""

            # Add user message to history
            self.conversation_history.append({
                "role": "system",
                "content": system_message
            })
            self.conversation_history.append({
                "role": "user",
                "content": user_input
            })
            
            # GPT-4 function definitions
            functions = [
                {
                    "name": "add_hard_block",
                    "description": "Lägg till en hård blockering - anställd kan INTE jobba vid specifik tid (måste följas)",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "employee_name": {
                                "type": "string",
                                "description": "Namn på anställd"
                            },
                            "dates": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Lista med datum i ISO-format (YYYY-MM-DD)"
                            },
                            "shift_types": {
                                "type": "array",
                                "items": {"type": "string", "enum": ["day", "evening", "night", "all_day"]},
                                "description": "Pass-typer: day, evening, night, eller all_day för hela dagen"
                            },
                            "reason": {
                                "type": "string",
                                "description": "Anledning (semester, sjuk, annan anledning)"
                            }
                        },
                        "required": ["employee_name", "dates", "shift_types"]
                    }
                },
                {
                    "name": "add_soft_preference",
                    "description": "Lägg till en mjuk preferens - anställd FÖREDRAR INTE att jobba men kan om nödvändigt",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "employee_name": {
                                "type": "string",
                                "description": "Namn på anställd"
                            },
                            "dates": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Lista med datum i ISO-format (YYYY-MM-DD)"
                            },
                            "shift_types": {
                                "type": "array",
                                "items": {"type": "string", "enum": ["day", "evening", "night", "all_day"]},
                                "description": "Pass-typer: day, evening, night, eller all_day"
                            },
                            "reason": {
                                "type": "string",
                                "description": "Anledning för preferens"
                            }
                        },
                        "required": ["employee_name", "dates", "shift_types"]
                    }
                }
            ]
            
            # Call OpenAI with function calling
            client = get_openai_client()
            response = client.chat.completions.create(
                model=MODEL,
                messages=self.conversation_history,
                functions=functions,
                function_call="auto",
                temperature=0.1
            )
            
            message = response.choices[0].message
            
            # Check if function was called
            if message.function_call:
                function_name = message.function_call.name
                function_args = eval(message.function_call.arguments)
                
                logger.info(f"🤖 GPT-4 called function: {function_name} with args: {function_args}")
                
                # Find employee ID by name
                employee_name = function_args.get("employee_name", "")
                employee_id = self._find_employee_id(employee_name, employees)
                
                # Determine if hard or soft
                is_hard = (function_name == "add_hard_block")
                
                # Build constraint
                constraint = {
                    "employee_id": employee_id,
                    "employee_name": employee_name,
                    "dates": function_args.get("dates", []),
                    "shifts": function_args.get("shift_types", []),
                    "is_hard": is_hard,
                    "confidence": "high" if employee_id else "medium",
                    "constraint_type": "hard_blocked_slot" if is_hard else "preferred_shift",
                    "original_text": user_input,
                    "reason": function_args.get("reason", None)
                }
                
                if not employee_id:
                    constraint["reason"] = f"Kunde inte hitta anställd med namn '{employee_name}'"
                    constraint["confidence"] = "low"
                
                return {
                    "success": True,
                    "constraint": constraint,
                    "message": f"✅ Tolkade: {employee_name} {'kan inte' if is_hard else 'föredrar inte att'} jobba {function_args.get('shift_types')} {function_args.get('dates')}"
                }
            
            else:
                # No function called - GPT couldn't parse
                return {
                    "success": False,
                    "constraint": None,
                    "message": f"❌ Kunde inte tolka begäran: {message.content}",
                    "reason": "GPT-4 kunde inte identifiera en begränsning"
                }
                
        except Exception as e:
            logger.error(f"OpenAI parsing error: {str(e)}")
            return {
                "success": False,
                "constraint": None,
                "message": f"❌ Fel vid tolkning: {str(e)}",
                "reason": str(e)
            }
    
    def _find_employee_id(self, name: str, employees: List[Dict[str, Any]]) -> Optional[str]:
        """Find employee ID by name (fuzzy match)"""
        name_lower = name.lower().strip()
        
        for emp in employees:
            # Construct full name from first_name and last_name
            first_name = emp.get("first_name", "").strip()
            last_name = emp.get("last_name", "").strip()
            full_name = f"{first_name} {last_name}".strip().lower()
            
            # Exact match
            if name_lower == full_name:
                return emp.get("id")
            # Partial match (first name or last name)
            if name_lower == first_name.lower() or name_lower == last_name.lower():
                return emp.get("id")
            # Partial match in full name
            if name_lower in full_name or full_name in name_lower:
                return emp.get("id")
        
        return None


def parse_natural_language_constraint(
    user_input: str,
    employees: List[Dict[str, Any]],
    context_date: Optional[str] = None
) -> Dict[str, Any]:
    """
    Convenience function to parse a single constraint
    
    Args:
        user_input: Natural language constraint in Swedish
        employees: List of employee dicts
        context_date: Context date for relative parsing
        
    Returns:
        Parsed constraint dict
    """
    parser = OpenAIConstraintParser()
    return parser.parse_constraint(user_input, employees, context_date)
