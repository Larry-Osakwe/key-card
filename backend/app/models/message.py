from pydantic import BaseModel
from typing import Optional

class Message(BaseModel):
    """
    Message model for communication between client and server.
    
    Attributes:
        content: The message content
        pr_url: Optional GitHub PR URL for analysis
        previous_content: Optional previous message for context in conversations
    """
    content: str
    pr_url: Optional[str] = None
    previous_content: Optional[str] = None 