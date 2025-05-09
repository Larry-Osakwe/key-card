from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from dotenv import load_dotenv
from .routers import chat
from .services.mcp.server_runner import setup_mcp_servers

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

app = FastAPI(title="Customer Support Query System")

# Configure CORS
origins = [
    "http://localhost:3000",                    # Local development
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Set up MCP servers
setup_mcp_servers(app)

# Include the chat router
app.include_router(chat.router, prefix="/api")

# Root endpoint
@app.get("/")
def read_root():
    return {"message": "Customer Support API is running"}



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 