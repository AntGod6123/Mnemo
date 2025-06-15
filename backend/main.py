from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.config import router as config_router
from routes.search import router as search_router
from routes.zim_routes import router as zim_router
from routes.translate import router as translate_router
from routes.llm import router as llm_router
from routes.auth import router as auth_router
from routes.logs import router as logs_router
from routes.zim_loader import load_zim_files
from logger import logger

app = FastAPI()

# CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all routers
app.include_router(config_router)
app.include_router(search_router)
app.include_router(zim_router)
app.include_router(translate_router)
app.include_router(llm_router)
app.include_router(auth_router)
app.include_router(logs_router)

# Load ZIMs on startup without blocking on indexing
logger.info("Mnemo server starting up")
load_zim_files(blocking=False)
