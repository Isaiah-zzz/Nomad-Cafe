import bcrypt
import hashlib


def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt.
    
    Bcrypt has a 72-byte limit. For passwords longer than 72 bytes,
    we pre-hash with SHA-256 to create a fixed 64-character hex string
    that can be safely passed to bcrypt. This allows passwords of any length.
    
    Args:
        password: Plain text password
    
    Returns:
        Hashed password string (bcrypt hash)
    """
    password_bytes = password.encode('utf-8')
    # If password exceeds bcrypt's 72-byte limit, pre-hash with SHA-256
    if len(password_bytes) > 72:
        # SHA-256 produces a 64-character hex string (32 bytes), which is well under bcrypt's limit
        password = hashlib.sha256(password_bytes).hexdigest()
        password_bytes = password.encode('utf-8')
    
    # Generate salt and hash the password
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash.
    
    Bcrypt has a 72-byte limit. For passwords longer than 72 bytes,
    we pre-hash with SHA-256 (matching the process in hash_password)
    before verification.
    
    Args:
        plain_password: Plain text password to verify
        hashed_password: Hashed password to compare against
    
    Returns:
        True if password matches, False otherwise
    """
    password_bytes = plain_password.encode('utf-8')
    # If password exceeds bcrypt's 72-byte limit, pre-hash with SHA-256
    # (must match the process used in hash_password)
    if len(password_bytes) > 72:
        plain_password = hashlib.sha256(password_bytes).hexdigest()
        password_bytes = plain_password.encode('utf-8')
    
    # Verify the password
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)

