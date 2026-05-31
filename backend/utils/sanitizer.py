import re

def sanitize_text_input(text: str, max_length: int = 500) -> str:
    # membersihkan input teks dari pola prompt injection dan membatasi panjang karakter
    if not text or not isinstance(text, str):
        return ""
    
    # batasi panjang input maksimal 500 karakter
    sanitized = text[:max_length]

    # hapus pola prompt injection yang dikenal
    injection_patterns = [
        r"ignore previous instructions",
        r"you are now",
        r"system:",
        r"###"
    ]

    for pattern in injection_patterns:
        # menghapus pola (case-insensitive)
        sanitized = re.sub(pattern, "", sanitized, flags=re.IGNORECASE)

    return sanitized.strip()

def validate_numeric_range(value: float, min_val: float, max_val:float, field_name: str) -> float:
    # memvalidasi input angka biar ada di dalam rentang yang diijinin
    try: 
        val = float(value)
    except (ValueError, TypeError):
        raise ValueError(f"Input '{field_name}' harus berupa angka.")
    if not (min_val <= val <= max_val):
        raise ValueError(f"Nilai '{field_name}' harus berada di antara {min_val} dan {max_val}.")
    
    return val

def validate_enum(value: str, allowed_values: list[str], field_name: str) -> str:
    # memvalidasi input string biar sesuai sama daftar nilai yang diijinin
    if not isinstance(value, str) or value not in allowed_values:
        raise ValueError(f"Nilai '{field_name}' tidak valid. Pilihan yang diizinkan: {', '.join(allowed_values)}.")
    
    return value
