import os
import uuid

import pytest
import requests


BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://travel-hub-demo-1.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "admin@sukharatravels.com"
ADMIN_PASSWORD = "SukharaAdmin!2026"


@pytest.fixture
def client():
    session = requests.Session()
    session.headers["Content-Type"] = "application/json"
    return session


def test_public_content_and_settings(client):
    settings = client.get(f"{BASE_URL}/api/settings")
    destinations = client.get(f"{BASE_URL}/api/destinations?featured=true")
    packages = client.get(f"{BASE_URL}/api/packages?featured=true")
    assert settings.status_code == 200 and settings.json()["whatsapp"] == "919876543210"
    assert destinations.status_code == 200 and len(destinations.json()) == 8
    assert all(item["published"] and item["featured"] for item in destinations.json())
    assert packages.status_code == 200 and len(packages.json()) == 4


def test_detail_routes_include_related_content(client):
    destination = client.get(f"{BASE_URL}/api/destinations/goa")
    package = client.get(f"{BASE_URL}/api/packages/goa-slowly")
    assert destination.status_code == 200 and destination.json()["name"] == "Goa"
    assert destination.json()["related_packages"]
    assert package.status_code == 200 and package.json()["title"] == "Goa, Slowly"
    assert len(package.json()["itinerary"]) == 5


def test_public_submissions_persist(client):
    marker = f"TEST_{uuid.uuid4().hex[:10]}"
    enquiry = client.post(f"{BASE_URL}/api/enquiries", json={"name": marker, "phone": "9876543210", "source": "regression", "package_id": "goa-slowly"})
    contact = client.post(f"{BASE_URL}/api/contact-submissions", json={"name": marker, "email": "test@example.com", "message": "Regression contact"})
    assert enquiry.status_code == 201 and enquiry.json().get("id")
    assert contact.status_code == 201 and contact.json().get("id")


def test_admin_protection_and_cookie_session(client):
    assert client.get(f"{BASE_URL}/api/admin/enquiries").status_code == 401
    login = client.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert login.status_code == 200
    assert "access_token" in client.cookies and "refresh_token" in client.cookies
    assert client.cookies["access_token"]
    assert client.get(f"{BASE_URL}/api/auth/me").json()["role"] == "admin"
    assert client.get(f"{BASE_URL}/api/admin/enquiries").status_code == 200