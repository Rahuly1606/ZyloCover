#!/usr/bin/env python
"""Start the backend server from the correct directory"""
import os
import sys
import subprocess

# Change to Backend directory
backend_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(backend_dir)
sys.path.insert(0, backend_dir)

# Run uvicorn
subprocess.run([
    sys.executable, '-m', 'uvicorn',
    'app.main:app',
    '--reload',
    '--port', '8000'
])
