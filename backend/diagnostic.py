#!/usr/bin/env python3
"""
Diagnostic script untuk debug API errors
"""
import requests
import json
import sys

BASE_URL = "http://127.0.0.1:5000"

def print_section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

def test_health():
    """Test health endpoint"""
    print_section("1. Testing Health Endpoint")
    try:
        resp = requests.get(f"{BASE_URL}/health", timeout=5)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.json()}")
        return resp.status_code == 200
    except Exception as e:
        print(f"ERROR: {e}")
        return False

def test_cors_preflight():
    """Test CORS preflight"""
    print_section("2. Testing CORS Preflight (OPTIONS)")
    try:
        resp = requests.options(
            f"{BASE_URL}/api/analyze",
            headers={
                "Origin": "http://localhost:8000",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type"
            },
            timeout=5
        )
        print(f"Status: {resp.status_code}")
        print(f"Headers received:")
        for key, val in resp.headers.items():
            if 'access-control' in key.lower():
                print(f"  {key}: {val}")
        return resp.status_code == 204
    except Exception as e:
        print(f"ERROR: {e}")
        return False

def test_analyze_api():
    """Test analyze endpoint"""
    print_section("3. Testing POST /api/analyze")
    
    payload = {
        "height": 175,
        "weight": 75,
        "age": 25,
        "gender": "male",
        "activity_level": "moderately_active",
        "fitness_goal": "weight_loss"
    }
    
    print(f"Sending payload: {json.dumps(payload, indent=2)}")
    
    try:
        resp = requests.post(
            f"{BASE_URL}/api/analyze",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        print(f"\nStatus: {resp.status_code}")
        
        if resp.status_code == 200:
            data = resp.json()
            print(f"✅ SUCCESS!")
            print(f"Response keys: {list(data.keys())}")
            print(f"BMI: {data.get('bmi')}")
            print(f"BMI Category: {data.get('bmi_category')}")
            print(f"TDEE: {data.get('tdee')}")
            print(f"Target Calories: {data.get('target_calories')}")
            ai_text = str(data.get('ai_interpretation'))
            print(f"AI Response: {ai_text[:100]}..." if len(ai_text) > 100 else f"AI Response: {ai_text}")
            return True
        else:
            print(f"❌ FAILED with status {resp.status_code}")
            print(f"Response: {resp.text}")
            return False
            
    except requests.exceptions.Timeout:
        print(f"❌ TIMEOUT - API took too long to respond (possibly Gemini API issue)")
        return False
    except requests.exceptions.ConnectionError:
        print(f"❌ CONNECTION ERROR - Backend not running on port 5000")
        return False
    except Exception as e:
        print(f"❌ ERROR: {type(e).__name__}: {e}")
        return False

def main():
    print("\n" + "="*60)
    print("  DraA Fitness Backend - Diagnostic Test Suite")
    print("="*60)
    print(f"\nTesting: {BASE_URL}")
    
    results = {
        "Health Check": test_health(),
        "CORS Preflight": test_cors_preflight(),
        "API Analyze": test_analyze_api()
    }
    
    print_section("SUMMARY")
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{test_name:.<40} {status}")
    
    all_passed = all(results.values())
    print(f"\nOverall: {'✅ ALL TESTS PASSED' if all_passed else '❌ SOME TESTS FAILED'}")
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())
