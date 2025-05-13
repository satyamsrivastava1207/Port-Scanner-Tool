from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import socket
import concurrent.futures
import time

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/scan', methods=['POST'])
def scan_ports():
    data = request.get_json()
    target = data.get('target')
    port_range = data.get('portRange')

    if not target or not port_range:
        return jsonify({'error': 'Missing target or port range'}), 400

    try:
        start_port, end_port = map(int, port_range.split('-'))
        if start_port < 0 or end_port > 65535 or start_port > end_port:
            raise ValueError("Invalid port range values.")
    except Exception:
        return jsonify({'error': 'Invalid port range format'}), 400

    try:
        ip_address = socket.gethostbyname(target)
        hostname = socket.getfqdn(target)
    except Exception:
        return jsonify({'error': 'Invalid host'}), 400

    open_ports = []

    def scan_port(port):
        result_data = {}
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1)
            result = sock.connect_ex((target, port))
            if result == 0:
                try:
                    sock.sendall(f"HEAD / HTTP/1.1\r\nHost: {target}\r\n\r\n".encode())
                    banner = sock.recv(1024).decode('utf-8', errors='ignore').strip()
                except Exception:
                    banner = "No banner detected"
                result_data = {'port': port, 'banner': banner}
            sock.close()
        except Exception:
            pass
        return result_data

    total_ports = end_port - start_port + 1
    start_time = time.time()

    with concurrent.futures.ThreadPoolExecutor(max_workers=100) as executor:
        futures = [executor.submit(scan_port, port) for port in range(start_port, end_port + 1)]
        for future in concurrent.futures.as_completed(futures):
            result = future.result()
            if result:
                open_ports.append(result)

    end_time = time.time()
    scan_duration = round(end_time - start_time, 2)

    return jsonify({
        'ip_address': ip_address,
        'hostname': hostname,
        'open_ports': open_ports,
        'duration': scan_duration,
        'total_ports': total_ports
    })

if __name__ == '__main__':
    app.run(debug=True)
