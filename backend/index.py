from contextlib import asynccontextmanager  # ← NAYA (1)
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from messaging.connection import connect_rabbitmq, close_rabbitmq  # ← NAYA (1)


from auth.routes import router as auth_router
from config import settings
from database import DbSession
from errors import register_error_handlers

# Tables are created by Alembic migrations (`alembic upgrade head`), not create_all:
# create_all never alters an existing table, so new columns would silently be missing.

app = FastAPI(title="TicketRush auth-service")


@asynccontextmanager  # ← NAYA (2)
async def lifespan(app: FastAPI):
    await connect_rabbitmq()  # subah: app start par connect
    yield  # app chal raha hai, requests le raha hai
    await close_rabbitmq()


app = FastAPI(title="TicketRush auth-service", lifespan=lifespan)  # ← BADLA (3)

# In dev the Vite proxy makes calls same-origin, so CORS is only needed when the
# browser calls this service directly. allow_credentials lets the refresh cookie through.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_error_handlers(app)
app.include_router(auth_router)


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    """Liveness: the process is up."""
    return {"status": "ok"}


@app.get("/health/ready", tags=["health"])
def ready(db: DbSession) -> dict[str, str]:
    """Readiness: the process can reach its database."""
    db.execute(text("SELECT 1"))
    return {"status": "ready"}
