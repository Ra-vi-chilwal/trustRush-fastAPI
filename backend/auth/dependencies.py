from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from auth.models import User
from auth.security import decode_token
from database import DbSession
from errors import AppError

# auto_error=False: a missing header would otherwise give 403. The frontend
# (and the HTTP spec) treat "no / bad credentials" as 401.
bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    db: DbSession,
) -> User:
    unauthorized = AppError(
        401, "INVALID_TOKEN", "Invalid or expired token", headers={"WWW-Authenticate": "Bearer"}
    )

    if credentials is None:
        raise unauthorized

    user_id = decode_token(credentials.credentials, expected_type="access")
    if user_id is None:
        raise unauthorized

    user = db.get(User, user_id)
    if user is None:
        raise unauthorized

    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
