import requests
import json

# Configuración
API_URL = "http://localhost:5000/api/v1"

def test_categories_endpoint():
    """Test the categories endpoint"""
    print("Testing categories endpoint...")
    
    try:
        # Test GET /categories
        url = f"{API_URL}/categories"
        print(f"Making request to: {url}")
        
        response = requests.get(url, headers={
            'Content-Type': 'application/json'
        })
        
        print(f"Response status: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response data: {json.dumps(data, indent=2, ensure_ascii=False)}")
            
            if data.get('success'):
                categories = data.get('data', [])
                print(f"Number of categories found: {len(categories)}")
                
                if categories:
                    print("First few categories:")
                    for i, cat in enumerate(categories[:3]):
                        print(f"  {i+1}. {cat.get('name', 'N/A')} (ID: {cat.get('id', 'N/A')})")
                else:
                    print("No categories found in database")
            else:
                print(f"API returned success: false - {data.get('error', 'Unknown error')}")
        else:
            print(f"Error response: {response.text}")
            
    except Exception as e:
        print(f"Error testing categories endpoint: {e}")

if __name__ == "__main__":
    test_categories_endpoint() 