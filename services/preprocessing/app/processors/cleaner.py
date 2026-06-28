import re
from urllib.parse import urlparse

from bs4 import BeautifulSoup


def clean_text(body: str) -> str:
    return " ".join(BeautifulSoup(body, "html.parser").get_text(" ").split())


def extract_urls(body: str) -> list[str]:
    return re.findall(r"https?://[^\s<>\"]+", body)


def detect_language(_: str) -> str:
    return "en"


def sender_domain(sender: str) -> str | None:
    parsed = urlparse(f"mailto://{sender}")
    return parsed.path.split("@", 1)[1] if "@" in parsed.path else None

