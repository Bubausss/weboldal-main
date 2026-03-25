import socket
import struct
import urllib.request
import urllib.error
import base64
import sys

# ==============================================================================
# Anely DNS Proxy Server
# This script bridges the gap between the C++ Kernel Driver (which uses UDP DNS 
# for stealth) and the PHP backend (which expects standard HTTP GET requests).
# 
# Flow:
# 1. Driver sends UDP DNS query to Port 53: <hwid>.cheat.<yourdomain.com>
# 2. This Python script receives it, extracts the <hwid>
# 3. Queries the local PHP script via HTTP: http://127.0.0.1/api/fetch_config.php?hwid=<hwid>
# 4. Receives Base64 AES encrypted config from PHP
# 5. Converts Base64 -> Raw Bytes -> Base32 (RFC4648)
# 6. Returns standard DNS TXT record to the Driver via UDP
# ==============================================================================

# --- Configuration ---
DNS_BIND_IP = "0.0.0.0"
DNS_BIND_PORT = 53
PHP_ENDPOINT = "http://127.0.0.1/api/fetch_config.php"

# Base32 standard alphabet (matches the C kernel driver's Base32Table)
BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"

def base32_encode(data: bytes) -> str:
    """Encode bytes to Base32 without padding (RFC 4648)."""
    result = ""
    bits = 0
    bit_count = 0
    
    for byte in data:
        bits = (bits << 8) | byte
        bit_count += 8
        while bit_count >= 5:
            bit_count -= 5
            index = (bits >> bit_count) & 0x1F
            result += BASE32_ALPHABET[index]
            
    if bit_count > 0:
        index = (bits << (5 - bit_count)) & 0x1F
        result += BASE32_ALPHABET[index]
        
    return result

def parse_dns_query(data: bytes):
    """Extremely basic DNS query parser."""
    try:
        # DNS Header is 12 bytes
        # Format: ID (2), Flags (2), QDCOUNT (2), ANCOUNT (2), NSCOUNT (2), ARCOUNT (2)
        transaction_id = data[:2]
        
        # Parse QNAME
        idx = 12
        domain_parts = []
        while True:
            length = data[idx]
            if length == 0:
                idx += 1
                break
            idx += 1
            domain_parts.append(data[idx:idx+length].decode('utf-8'))
            idx += length
            
        full_domain = ".".join(domain_parts)
        qtype = struct.unpack(">H", data[idx:idx+2])[0]
        
        return transaction_id, full_domain, qtype, idx + 4
    except Exception as e:
        print(f"[-] Failed to parse DNS query: {e}")
        return None, None, None, None

def build_dns_txt_response(transaction_id: bytes, query_name: str, txt_data: str) -> bytes:
    """Builds a DNS response packet with a single TXT record."""
    # Split TXT data into 255-byte chunks (DNS limitation)
    txt_chunks = [txt_data[i:i+255] for i in range(0, len(txt_data), 255)]
    
    # Header: ID, Flags (0x8180 = standard response, no error), QD=1, AN=1, NS=0, AR=0
    header = transaction_id + struct.pack(">HHHHH", 0x8180, 1, 1, 0, 0)
    
    # Question part
    qname_bytes = b''
    for part in query_name.split('.'):
        qname_bytes += bytes([len(part)]) + part.encode('utf-8')
    qname_bytes += b'\x00'
    question = qname_bytes + struct.pack(">HH", 16, 1) # Type TXT (16), Class IN (1)
    
    # Answer part
    # Pointer to qname (0xC00C = offset 12)
    answer = b'\xc0\x0c' 
    answer += struct.pack(">HHI", 16, 1, 60) # Type TXT, Class IN, TTL 60
    
    # Calculate RDLENGTH
    # Each chunk has a 1-byte length prefix
    rdlength = sum(1 + len(chunk) for chunk in txt_chunks)
    answer += struct.pack(">H", rdlength)
    
    # Add TXT chunks
    for chunk in txt_chunks:
        chunk_bytes = chunk.encode('utf-8')
        answer += bytes([len(chunk_bytes)]) + chunk_bytes
        
    return header + question + answer

def handle_query(sock, data, addr):
    tid, domain, qtype, _ = parse_dns_query(data)
    if not domain:
        return
        
    print(f"[*] DNS Query from {addr[0]}: {domain} (Type: {qtype})")
    
    # Only answer TXT queries (16) that match our pattern <hwid>.cheat.*
    if qtype != 16 or ".cheat." not in domain:
        return
        
    # Extract HWID (first part of the domain)
    hwid = domain.split('.')[0]
    print(f"[*] Extracted HWID: {hwid}")
    
    # Call PHP backend
    try:
        url = f"{PHP_ENDPOINT}?hwid={hwid}"
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=5) as response:
            php_response = response.read().decode('utf-8').strip()
            
        print(f"[*] PHP Response received")
        
        # PHP sends Base64, Driver expects Base32
        # Convert: Base64 -> Raw AES Bytes -> Base32
        raw_aes_bytes = base64.b64decode(php_response)
        base32_response = base32_encode(raw_aes_bytes)
        
        print(f"[*] Encoded to Base32: {len(base32_response)} chars")
        
        # Send DNS TXT Response
        dns_response = build_dns_txt_response(tid, domain, base32_response)
        sock.sendto(dns_response, addr)
        print(f"[*] DNS response sent to {addr[0]}")
        
    except Exception as e:
        print(f"[-] HTTP Error contacting PHP: {e}")

def main():
    print(f"[*] Starting Anely DNS Proxy on {DNS_BIND_IP}:{DNS_BIND_PORT}")
    try:
        # Require root/admin to bind port 53
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.bind((DNS_BIND_IP, DNS_BIND_PORT))
        print(f"[*] Listening for DNS queries...")
        
        while True:
            data, addr = sock.recvfrom(512)
            handle_query(sock, data, addr)
            
    except PermissionError:
        print("[-] FATAL: Cannot bind Port 53. Please run as root/administrator.")
        sys.exit(1)
    except Exception as e:
        print(f"[-] FATAL: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
