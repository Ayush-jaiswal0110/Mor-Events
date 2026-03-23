import requests
import json
import time

BASE_URL = "http://127.0.0.1:8080/api"
TOKEN = None

def print_result(name, res):
    print(f"[{res.status_code}] {name}")
    if res.status_code >= 400:
        print(f"ERROR: {res.text}")

def run_tests():
    global TOKEN
    print("--- STARTING API TESTS ---")
    
    # 1. Login
    res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "admin@morevents.com",
        "password": "securepassword123"
    })
    print_result("Auth Login", res)
    if res.status_code == 200:
        TOKEN = res.json().get('token')
        
    headers = {"Authorization": f"Bearer {TOKEN}"} if TOKEN else {}

    # 2. Verify Token
    res = requests.get(f"{BASE_URL}/auth/verify", headers=headers)
    print_result("Verify Token", res)

    # 3. Create Event
    event_data = {
        "name": "Test Event Automation",
        "description": "Test Description",
        "date": "2026-10-15",
        "price": 999
    }
    res = requests.post(f"{BASE_URL}/events", json=event_data, headers=headers)
    print_result("Create Event", res)
    event_id = None
    if res.status_code == 201:
        event_id = res.json()['data']['id']
        print(f"Created Event ID: {event_id}")

    # 4. Get Events
    res = requests.get(f"{BASE_URL}/events")
    print_result("Get All Events", res)

    if event_id:
        # 5. Get Single Event
        res = requests.get(f"{BASE_URL}/events/{event_id}")
        print_result("Get Single Event", res)

        # 6. Create Registration
        reg_data = {
            "name": "Test User",
            "email": "test@example.com",
            "phone": "9999999999",
            "eventId": event_id
        }
        res = requests.post(f"{BASE_URL}/registrations", json=reg_data)
        print_result("Create Registration", res)
        reg_id = None
        if res.status_code == 201:
            reg_id = res.json()['data']['id']

        if reg_id:
            # 7. Update Payment
            res = requests.patch(f"{BASE_URL}/registrations/{reg_id}/payment", json={
                "paymentStatus": "paid",
                "paymentId": "test_pay_id"
            }, headers=headers)
            print_result("Update Registration Payment", res)

        # 8. Create Review
        review_data = {
            "eventId": event_id,
            "name": "Test User",
            "rating": 5,
            "text": "Great test event!"
        }
        res = requests.post(f"{BASE_URL}/reviews", json=review_data)
        print_result("Create Review", res)
        rev_id = None
        if res.status_code == 201:
            rev_id = res.json()['data']['id']

        # 9. Get Dashboard Stats
        res = requests.get(f"{BASE_URL}/analytics/dashboard", headers=headers)
        print_result("Get Dashboard Stats", res)

        # 10. Delete Test Data
        if rev_id:
            res = requests.delete(f"{BASE_URL}/reviews/{rev_id}", headers=headers)
            print_result("Delete Review", res)
        if reg_id:
            res = requests.delete(f"{BASE_URL}/registrations/{reg_id}", headers=headers)
            print_result("Delete Registration", res)
            
        res = requests.delete(f"{BASE_URL}/events/{event_id}", headers=headers)
        print_result("Delete Event", res)

    print("--- FINISHED API TESTS ---")

if __name__ == "__main__":
    # Wait for server slightly
    time.sleep(2)
    run_tests()
