#!/usr/bin/env python3
"""
Simple HTTP server that always serves index.html for root requests
"""
import http.server
import socketserver
import os
import sys

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

def main():
    PORT = 8000
    
    # Change to the script's directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Check if index.html exists
    if not os.path.exists('index.html'):
        print("ERROR: index.html not found in current directory!")
        print(f"Current directory: {os.getcwd()}")
        sys.exit(1)
    
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

