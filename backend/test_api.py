#!/usr/bin/env python3
"""
Quick test script untuk test API endpoint /api/analyze
"""
import requests
import json

BASE_URL = "http://127.0.0.1:5000"

# Test data valid
test_payload = {
    "height": 175,
    "weight": 75,
    "age": 25,
    "gender": "male",
    "activity_level": "moderately_active",
    "fitness_goal": "weight_loss"
}

def test_health_check():
    """Test health endpoint"""
    print("🔍 Testing health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        print(f"✅ Health check: {response.status_code}")
        print(f"Response: {response.json()}\n")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Health check failed: {str(e)}\n")
        return False

def test_cors_preflight():
    """Test CORS preflight (OPTIONS request)"""
    print("🔍 Testing CORS preflight...")
    try:
        response = requests.options(
            f"{BASE_URL}/api/analyze",
            headers={
                "Origin": "http://localhost:8000",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type"
            },
            timeout=5
        )
        print(f"✅ CORS preflight: {response.status_code}")
        print(f"Headers: {dict(response.headers)}\n")
        return response.status_code == 204
    except Exception as e:
        print(f"❌ CORS preflight failed: {str(e)}\n")
        return False

def test_analyze_api():
    """Test analyze endpoint"""
    print("🔍 Testing /api/analyze endpoint...")
    try:
        response = requests.post(
            f"{BASE_URL}/api/analyze",
            json=test_payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        print(f"✅ API response: {response.status_code}")
        data = response.json()
        print(f"Response keys: {list(data.keys())}")
        if response.status_code == 200:
            print(f"BMI: {data.get('bmi')}")
            print(f"BMI Category: {data.get('bmi_category')}")
            print(f"TDEE: {data.get('tdee')}")
            print(f"Target Calories: {data.get('target_calories')}")
            print(f"AI Interpretation (first 100 chars): {str(data.get('ai_interpretation'))[:100]}...\n")
        else:
            print(f"Error: {data}\n")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ API test failed: {str(e)}\n")
        return False

def main():
    print("=" * 50)
    print("API Testing Suite - DraA Fitness Backend")
    print("=" * 50 + "\n")
    
    results = {
        "health": test_health_check(),
        "cors": test_cors_preflight(),
        "analyze": test_analyze_api()
    }
    
    print("=" * 50)
    print("Summary:")
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{test_name}: {status}")
    print("=" * 50)

if __name__ == "__main__":
    main()
