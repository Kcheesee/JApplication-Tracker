"""
Encryption utility for securing API keys and sensitive data
"""
from cryptography.fernet import Fernet
import base64
import os
from typing import Optional


class EncryptionService:
    """Service for encrypting and decrypting sensitive data like API keys"""

    def __init__(self, encryption_key: Optional[str] = None):
        """
        Initialize the encryption service

        Args:
            encryption_key: Base64-encoded encryption key. If not provided,
                          will use ENCRYPTION_KEY from environment
        """
        if encryption_key is None:
            encryption_key = os.getenv('ENCRYPTION_KEY')

        if not encryption_key:
            raise ValueError(
                "ENCRYPTION_KEY must be set in environment variables. "
                "Generate one with: python -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())'"
            )

        # Ensure the key is in bytes
        if isinstance(encryption_key, str):
            encryption_key = encryption_key.encode()

        self.cipher = Fernet(encryption_key)

    def encrypt(self, plaintext: str) -> str:
        """
        Encrypt a string

        Args:
            plaintext: The string to encrypt

        Returns:
            Base64-encoded encrypted string
        """
        if not plaintext:
            return ""

        encrypted = self.cipher.encrypt(plaintext.encode())
        return base64.b64encode(encrypted).decode()

    def decrypt(self, ciphertext: str) -> str:
        """
        Decrypt a string

        Args:
            ciphertext: Base64-encoded encrypted string

        Returns:
            Decrypted plaintext string
        """
        if not ciphertext:
            return ""

        try:
            decoded = base64.b64decode(ciphertext.encode())
            decrypted = self.cipher.decrypt(decoded)
            return decrypted.decode()
        except Exception as e:
            # Log error but don't expose details
            print(f"Decryption error: {e}")
            return ""

    @staticmethod
    def generate_key() -> str:
        """
        Generate a new encryption key

        Returns:
            Base64-encoded encryption key
        """
        return Fernet.generate_key().decode()


# Singleton instance
_encryption_service: Optional[EncryptionService] = None


def get_encryption_service() -> EncryptionService:
    """Get or create the encryption service singleton"""
    global _encryption_service

    if _encryption_service is None:
        _encryption_service = EncryptionService()

    return _encryption_service


def encrypt_api_key(api_key: str) -> str:
    """
    Convenience function to encrypt an API key

    Args:
        api_key: The API key to encrypt

    Returns:
        Encrypted API key
    """
    if not api_key:
        return ""

    service = get_encryption_service()
    return service.encrypt(api_key)


def decrypt_api_key(encrypted_key: str) -> str:
    """
    Convenience function to decrypt an API key

    Args:
        encrypted_key: The encrypted API key

    Returns:
        Decrypted API key
    """
    if not encrypted_key:
        return ""

    service = get_encryption_service()
    return service.decrypt(encrypted_key)
