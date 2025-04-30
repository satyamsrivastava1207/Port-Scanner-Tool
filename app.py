from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import socket

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
    except Exception as e:
        return jsonify({'error': 'Invalid port range format'}), 400

    open_ports = []

    for port in range(start_port, end_port + 1):
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(0.5)
            result = sock.connect_ex((target, port))
            if result == 0:
                open_ports.append(port)
            sock.close()
        except:
            continue

    return jsonify({'open_ports': open_ports})

if __name__ == '__main__':
    app.run(debug=True)
