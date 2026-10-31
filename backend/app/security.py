"""Хеширование паролей и непрозрачных токенов сессий без хранения секретов открыто."""

import hashlib
import hmac
import secrets

SCRYPT_N = 2**14
SCRYPT_R = 8
SCRYPT_P = 1
SCRYPT_LENGTH = 64


def hash_password(password: str) -> str:
    """Создаёт хеш scrypt с новой случайной солью."""
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(
        password.encode(), salt=salt, n=SCRYPT_N, r=SCRYPT_R, p=SCRYPT_P, dklen=SCRYPT_LENGTH
    )
    return f"scrypt${SCRYPT_N}${SCRYPT_R}${SCRYPT_P}${salt.hex()}${digest.hex()}"


def verify_password(password: str, encoded_hash: str) -> bool:
    """Проверяет пароль с постоянным по времени сравнением результата."""
    try:
        algorithm, n, r, p, salt_hex, expected_hex = encoded_hash.split("$")
        if algorithm != "scrypt":
            return False
        actual = hashlib.scrypt(
            password.encode(),
            salt=bytes.fromhex(salt_hex),
            n=int(n),
            r=int(r),
            p=int(p),
            dklen=len(bytes.fromhex(expected_hex)),
        )
    except (ValueError, TypeError):
        return False
    return hmac.compare_digest(actual, bytes.fromhex(expected_hex))


def new_session_token() -> str:
    """Создаёт криптографически случайный токен достаточной длины."""
    return secrets.token_urlsafe(32)


def hash_session_token(token: str) -> str:
    """Превращает токен cookie в необратимый отпечаток для базы."""
    return hashlib.sha256(token.encode()).hexdigest()
