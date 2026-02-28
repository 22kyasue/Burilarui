import requests
import json
import sys

def test_search_api():
    url = "http://127.0.0.1:5050/api/search"
    payload = {"query": "Tesla Robotaxi event"}
    headers = {"Content-Type": "application/json"}

    try:
        response = requests.post(url, json=payload, headers=headers)
        if response.status_code == 200:
            data = response.json()
            print("Full Response:")
            print(json.dumps(data, indent=2, ensure_ascii=False))
        else:
            print(f"Error: Status Code {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"Exception: {str(e)}")

if __name__ == "__main__":
    test_search_api()
