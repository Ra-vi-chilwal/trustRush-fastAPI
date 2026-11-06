from typing import Annotated

from fastapi import APIRouter, Cookie, Response, status

from auth import service
from auth.dependencies import CurrentUser
from auth.models import User
from auth.schemas import TokenResponse, UserCreate, UserLogin, UserResponse
from auth.security import decode_token
from config import settings
from database import DbSession
from errors import AppError

router = APIRouter(prefix="/auth", tags=["auth"])

RefreshCookie = Annotated[str | None, Cookie(alias=settings.REFRESH_COOKIE_NAME)]


def _set_refresh_cookie(response: Response, tokens: service.IssuedTokens) -> None:
    response.set_cookie(
        key=settings.REFRESH_COOKIE_NAME,
        value=tokens.refresh_token,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path=settings.REFRESH_COOKIE_PATH,
        httponly=True,  # JS can't read it -> XSS can't steal it
        secure=settings.COOKIE_SECURE,
        samesite="lax",
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.REFRESH_COOKIE_NAME,
        path=settings.REFRESH_COOKIE_PATH,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="lax",
    )


def _token_response(response: Response, tokens: service.IssuedTokens) -> TokenResponse:
    _set_refresh_cookie(response, tokens)
    return TokenResponse(
        access_token=tokens.access_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


def _invalid_refresh() -> AppError:
    return AppError(401, "INVALID_REFRESH_TOKEN", "Invalid or expired refresh token")


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(data: UserCreate, db: DbSession) -> User:
    email_taken = AppError(409, "EMAIL_TAKEN", "Email already registered")
    if service.get_user_by_email(db, data.email):
        raise email_taken
    try:
        return service.create_user(db, data)
    except service.EmailTakenError:
        raise email_taken from None


@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, response: Response, db: DbSession) -> TokenResponse:
    user = service.authenticate_user(db, data.email, data.password)
    if user is None:
        raise AppError(401, "INVALID_CREDENTIALS", "Invalid email or password")
    return _token_response(response, service.issue_tokens(db, user.id))


@router.get("/me", response_model=UserResponse)
def me(current_user: CurrentUser) -> User:
    return current_user


@router.post("/refresh", response_model=TokenResponse)
def refresh(response: Response, db: DbSession, refresh_token: RefreshCookie = None) -> TokenResponse:
    if refresh_token is None or decode_token(refresh_token, "refresh") is None:
        _clear_refresh_cookie(response)
        raise _invalid_refresh()
    try:
        tokens = service.rotate_refresh_token(db, refresh_token)
    except service.InvalidRefreshTokenError:
        raise _invalid_refresh() from None
    return _token_response(response, tokens)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response, db: DbSession, refresh_token: RefreshCookie = None) -> None:
    if refresh_token is not None:
        service.revoke_refresh_token(db, refresh_token)
    _clear_refresh_cookie(response)
