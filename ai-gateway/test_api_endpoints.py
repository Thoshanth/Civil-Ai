"""
API Endpoint Testing for CivilAI Gateway
Tests all REST endpoints with HTTP requests
"""
import requests
import json
import sys
from pathlib import Path

BASE_URL = "http://localhost:8000"


def test_health_endpoint():
    """Test health check endpoint"""
    print("\n=== Testing Health Endpoint ===")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Health check passed: {data}")
            return True
        else:
            print(f"✗ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Health check error: {str(e)}")
        return False


def test_root_endpoint():
    """Test root endpoint"""
    print("\n=== Testing Root Endpoint ===")
    try:
        response = requests.get(f"{BASE_URL}/", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Root endpoint passed")
            print(f"  Service: {data.get('service')}")
            print(f"  Modules: {len(data.get('modules', []))}")
            return True
        else:
            print(f"✗ Root endpoint failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Root endpoint error: {str(e)}")
        return False


def test_iscode_search():
    """Test IS Code search endpoint"""
    print("\n=== Testing IS Code Search ===")
    try:
        response = requests.get(
            f"{BASE_URL}/api/iscode/search",
            params={"query": "minimum reinforcement", "limit": 3},
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            print(f"✓ IS Code search passed")
            print(f"  Found {data.get('count', 0)} results")
            return True
        else:
            print(f"✗ IS Code search failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ IS Code search error: {str(e)}")
        return False


def test_iscode_list():
    """Test IS Code list endpoint"""
    print("\n=== Testing IS Code List ===")
    try:
        response = requests.get(f"{BASE_URL}/api/iscode/codes", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✓ IS Code list passed")
            print(f"  Total codes: {data.get('count', 0)}")
            return True
        else:
            print(f"✗ IS Code list failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ IS Code list error: {str(e)}")
        return False


def test_iscode_compliance():
    """Test IS Code compliance check endpoint"""
    print("\n=== Testing IS Code Compliance Check ===")
    
    payload = {
        "design_type": "structural",
        "parameters": {
            "beam_width_mm": 300,
            "beam_depth_mm": 500,
            "steel_area_mm2": 1200,
            "stirrup_spacing_mm": 250,
            "concrete_grade": "M20",
            "steel_grade": "Fe415"
        },
        "codes_to_check": ["IS 456:2000"]
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/iscode/check",
            json=payload,
            timeout=30
        )
        if response.status_code == 200:
            data = response.json()
            print(f"✓ IS Code compliance check passed")
            if data.get('success'):
                result = data.get('data', {})
                print(f"  Status: {result.get('overall_status', 'N/A')}")
                print(f"  Checks: {len(result.get('checks', []))}")
                print(f"  Provider: {data.get('llm_provider', 'N/A')}")
            return True
        else:
            print(f"✗ IS Code compliance failed: {response.status_code}")
            print(f"  Response: {response.text[:200]}")
            return False
    except Exception as e:
        print(f"✗ IS Code compliance error: {str(e)}")
        return False


def test_structural_calculation():
    """Test structural load calculation endpoint"""
    print("\n=== Testing Structural Load Calculation ===")
    
    payload = {
        "building_type": "residential",
        "floor_area_m2": 400,
        "floors": 4,
        "zone": "IV",
        "soil_type": "II",
        "importance_factor": 1.0
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/structural/calculate",
            json=payload,
            timeout=30
        )
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Structural calculation passed")
            if data.get('success'):
                result = data.get('data', {})
                print(f"  Dead Load: {result.get('dead_load_kN', 'N/A')} kN")
                print(f"  Live Load: {result.get('live_load_kN', 'N/A')} kN")
                print(f"  Provider: {data.get('llm_provider', 'N/A')}")
            return True
        else:
            print(f"✗ Structural calculation failed: {response.status_code}")
            print(f"  Response: {response.text[:200]}")
            return False
    except Exception as e:
        print(f"✗ Structural calculation error: {str(e)}")
        return False


def test_boq_with_description():
    """Test BOQ analysis with text description"""
    print("\n=== Testing BOQ Analysis (Text) ===")
    
    description = """
    Construction of G+2 residential building:
    - Excavation: 200 cubic meters
    - PCC 1:3:6: 50 cubic meters
    - RCC M20: 120 cubic meters
    - Brick masonry: 150 cubic meters
    """
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/boq/analyze",
            data={"description": description},
            timeout=30
        )
        if response.status_code == 200:
            data = response.json()
            print(f"✓ BOQ analysis passed")
            if data.get('success'):
                result = data.get('data', {})
                print(f"  Items: {len(result.get('items', []))}")
                print(f"  Total: ₹{result.get('total_amount_inr', 'N/A')}")
                print(f"  Provider: {data.get('llm_provider', 'N/A')}")
            return True
        else:
            print(f"✗ BOQ analysis failed: {response.status_code}")
            print(f"  Response: {response.text[:200]}")
            return False
    except Exception as e:
        print(f"✗ BOQ analysis error: {str(e)}")
        return False


def test_module_health_checks():
    """Test health endpoints for all modules"""
    print("\n=== Testing Module Health Checks ===")
    
    modules = [
        "geotech",
        "boq",
        "iscode",
        "structural",
        "tender",
        "site"
    ]
    
    results = {}
    for module in modules:
        try:
            response = requests.get(f"{BASE_URL}/api/{module}/health", timeout=5)
            results[module] = response.status_code == 200
            status = "✓" if results[module] else "✗"
            print(f"  {status} {module}: {response.status_code}")
        except Exception as e:
            results[module] = False
            print(f"  ✗ {module}: {str(e)}")
    
    return all(results.values())


def run_all_api_tests():
    """Run all API endpoint tests"""
    print("=" * 60)
    print("CivilAI Gateway - API Endpoint Testing")
    print("=" * 60)
    print(f"Base URL: {BASE_URL}")
    
    results = {}
    
    # Basic endpoints
    results['health'] = test_health_endpoint()
    results['root'] = test_root_endpoint()
    
    # Module health checks
    results['module_health'] = test_module_health_checks()
    
    # IS Code endpoints
    results['iscode_search'] = test_iscode_search()
    results['iscode_list'] = test_iscode_list()
    results['iscode_compliance'] = test_iscode_compliance()
    
    # Structural calculation
    results['structural'] = test_structural_calculation()
    
    # BOQ analysis
    results['boq'] = test_boq_with_description()
    
    # Summary
    print("\n" + "=" * 60)
    print("API TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, passed_test in results.items():
        status = "✓ PASS" if passed_test else "✗ FAIL"
        print(f"{status} - {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    print("=" * 60)
    
    if passed < total:
        print("\n⚠ Some tests failed. Make sure:")
        print("  1. AI Gateway is running on http://localhost:8000")
        print("  2. All API keys are configured in .env")
        print("  3. Dependencies are installed")
    
    return passed == total


if __name__ == "__main__":
    success = run_all_api_tests()
    sys.exit(0 if success else 1)
