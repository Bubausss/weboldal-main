import socket
import requests
import base64
from dnslib import DNSRecord, QTYPE, RR, TXT

# Configuration
LISTEN_IP = "0.0.0.0"
LISTEN_PORT = 53
PHP_BACKEND_URL = "http://localhost/config"

def handle_dns_query(data, addr, s):
    try:
        request = DNSRecord.parse(data)
        reply = request.reply()
        qname = str(request.q.qname)
        
        # Format expected: <hwid>.cfg.anely.xyz
        # Example: abc-123.cfg.anely.xyz
        if ".cfg." in qname:
            hwid = qname.split(".cfg.")[0]
            print(f"[*] Request for HWID: {hwid}")
            
            # Fetch from PHP backend
            try:
                response = requests.get(f"{PHP_BACKEND_URL}?hwid={hwid}", timeout=5)
                if response.status_code == 200:
                    config_base64 = response.text.strip()
                    print(f"[+] Found config for {hwid}")
                    
                    # Return TXT record
                    reply.add_answer(RR(qname, QTYPE.TXT, rdata=TXT(config_base64)))
                else:
                    print(f"[-] Backend error: {response.status_code}")
            except Exception as e:
                print(f"[-] Request failed: {e}")
        
        s.sendto(reply.pack(), addr)
        
    except Exception as e:
        print(f"[-] DNS Error: {e}")

def main():
    print(f"[*] Starting DNS Proxy on {LISTEN_IP}:{LISTEN_PORT}...")
    print(f"[*] Forwarding to: {PHP_BACKEND_URL}")
    
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.bind((LISTEN_IP, LISTEN_PORT))
    
    while True:
        data, addr = s.recvfrom(1024)
        handle_dns_query(data, addr, s)

if __name__ == "__main__":
    main()
