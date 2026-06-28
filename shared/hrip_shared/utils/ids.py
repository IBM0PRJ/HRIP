from uuid import UUID, uuid4


def new_correlation_id() -> UUID:
    return uuid4()

