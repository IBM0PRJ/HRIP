from pathlib import Path

from hrip_shared.auth.jwt import _generate_dev_keys  # noqa: SLF001


def main() -> None:
    private_path = Path("keys/dev_rsa_private.pem")
    public_path = Path("keys/dev_rsa_public.pem")
    _generate_dev_keys(private_path, public_path)
    print(f"Generated {private_path} and {public_path}")


if __name__ == "__main__":
    main()
