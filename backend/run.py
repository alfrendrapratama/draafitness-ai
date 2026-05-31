#!/usr/bin/env python3
"""
Simple startup script untuk debug issues
"""
import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("=" * 60)
print("  DraA Fitness Backend - Startup Check")
print("=" * 60)

# Step 1: Check .env
print("\n[1/5] Checking .env file...")
if os.path.exists('.env'):
    with open('.env', 'r') as f:
        lines = f.readlines()
        for line in lines:
            if line.strip() and not line.startswith('#'):
                key = line.split('=')[0]
                print(f"  ✓ {key} configured")
else:
    print("  ✗ .env file not found!")
    sys.exit(1)

# Step 2: Check config
print("\n[2/5] Loading config...")
try:
    from config import Config
    print(f"  ✓ LLM_PROVIDER: {Config.LLM_PROVIDER}")
    print(f"  ✓ LLM_MODEL: {Config.LLM_MODEL}")
    print(f"  ✓ PORT: {Config.PORT}")
    print(f"  ✓ FLASK_ENV: {Config.FLASK_ENV}")
    print(f"  ✓ LLM_API_KEY: {'✓ SET' if Config.LLM_API_KEY else '✗ NOT SET'}")
except Exception as e:
    print(f"  ✗ Config Error: {e}")
    sys.exit(1)

# Step 3: Check imports
print("\n[3/5] Checking dependencies...")
try:
    from flask import Flask, jsonify
    print("  ✓ Flask imported")
    from flask_cors import CORS
    print("  ✓ Flask-CORS imported")
    from routes.analyze import analyze_bp
    print("  ✓ Analyze blueprint imported")
    from services import calculator, ai_service
    print("  ✓ Services imported")
except ImportError as e:
    print(f"  ✗ Import Error: {e}")
    print("\n  You may need to install requirements:")
    print("  pip install -r requirement.txt")
    sys.exit(1)

# Step 4: Create app
print("\n[4/5] Creating Flask app...")
try:
    from app import create_app
    app = create_app()
    print("  ✓ App created successfully")
except Exception as e:
    print(f"  ✗ App creation error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Step 5: Check routes
print("\n[5/5] Checking routes...")
try:
    routes = []
    for rule in app.url_map.iter_rules():
        routes.append(f"  ✓ {rule.methods - {'OPTIONS', 'HEAD'}} {rule.rule}")
    for route in sorted(routes):
        print(route)
except Exception as e:
    print(f"  ✗ Route check error: {e}")
    sys.exit(1)

print("\n" + "=" * 60)
print("  ✅ All checks passed! Starting server...")
print("=" * 60)
print(f"\n🚀 Server running on http://0.0.0.0:{Config.PORT}")
print("   (Frontend access: http://127.0.0.1:{Config.PORT})")
print("\nPress Ctrl+C to stop")
print()

# Start app
try:
    app.run(host='0.0.0.0', port=Config.PORT, debug=(Config.FLASK_ENV == 'development'))
except KeyboardInterrupt:
    print("\n\nServer stopped.")
except Exception as e:
    print(f"\n\n✗ Runtime error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
