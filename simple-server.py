#!/usr/bin/env python3
"""
Simple HTTP server that always serves index.html for root requests
"""
import http.server
import socketserver
import os
import sys

# On Windows, register a console control handler so the process exits
# cleanly when the terminal window is closed (not just Ctrl+C).
if sys.platform == 'win32':
    import ctypes
    import ctypes.wintypes
    _CTRL_CLOSE_EVENT = 2
    _HandlerRoutine = ctypes.WINFUNCTYPE(ctypes.c_bool, ctypes.c_ulong)
    def _console_handler(ctrl_type):
        if ctrl_type == _CTRL_CLOSE_EVENT:
            sys.exit(0)
        return False
    _handler_ref = _HandlerRoutine(_console_handler)  # keep reference alive
    ctypes.windll.kernel32.SetConsoleCtrlHandler(_handler_ref, True)

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers if needed
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()
    
    def do_GET(self):
        # If requesting root, serve index.html
        if self.path == '/' or self.path == '':
            self.path = '/index.html'
        return super().do_GET()

def find_free_port(start, count=20):
    """Return the first free TCP port in [start, start+count)."""
    import socket
    for port in range(start, start + count):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(("", port))
                return port
            except OSError:
                continue
    raise OSError(f"No free port found in range {start}–{start + count - 1}")


def main():
    preferred = int(os.environ.get('PORT', 8000))
    
    # Change to the script's directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Check if index.html exists
    if not os.path.exists('index.html'):
        print("ERROR: index.html not found in current directory!")
        print(f"Current directory: {os.getcwd()}")
        sys.exit(1)

    PORT = find_free_port(preferred)
    if PORT != preferred:
        print(f"⚠  Port {preferred} is in use — using {PORT} instead.")

    Handler = MyHTTPRequestHandler
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print("=" * 60)
        print("Server started successfully!")
        print("=" * 60)
        print(f"Local:   http://localhost:{PORT}")
        print(f"Network: http://127.0.0.1:{PORT}")
        print("=" * 60)
        print("Press Ctrl+C to stop the server")
        print("=" * 60)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\nServer stopped.")
            sys.exit(0)

if __name__ == "__main__":
    main()

