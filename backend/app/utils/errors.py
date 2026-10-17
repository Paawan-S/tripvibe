class AppError(Exception):
    """Base class for every error we raise on purpose."""

    status_code = 500

    def __init__(self, message: str):
        self.message = message
        super().__init__(message)


class NotFoundError(AppError):
    status_code = 404


class ValidationError(AppError):
    status_code = 400


class AuthError(AppError):
    status_code = 401


class AIGenerationError(AppError):
    status_code = 502