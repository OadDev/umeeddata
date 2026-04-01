"""
Test Fund Disbursements Feature
Tests:
1. GET /api/disbursements - list all disbursements with optional filters
2. GET /api/disbursements/summary - returns per campaign-month summary
3. POST /api/disbursements - admin only, creates disbursement
4. PUT /api/disbursements/{id} - admin only, updates disbursement
5. DELETE /api/disbursements/{id} - admin only, deletes disbursement
6. Role-based access control (admin vs user)
"""
import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestDisbursementsAPI:
    """Test Fund Disbursements CRUD endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - login as admin and get campaign data"""
        self.admin_session = requests.Session()
        self.user_session = requests.Session()
        
        # Login as admin
        admin_login = self.admin_session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@umeednow.org",
            "password": "admin123"
        })
        assert admin_login.status_code == 200, f"Admin login failed: {admin_login.text}"
        print(f"Admin login successful: {admin_login.json()}")
        
        # Login as user
        user_login = self.user_session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "user@umeednow.org",
            "password": "user123"
        })
        assert user_login.status_code == 200, f"User login failed: {user_login.text}"
        print(f"User login successful: {user_login.json()}")
        
        # Get campaigns for testing
        campaigns_response = self.admin_session.get(f"{BASE_URL}/api/campaigns")
        assert campaigns_response.status_code == 200
        self.campaigns = campaigns_response.json()
        assert len(self.campaigns) > 0, "No campaigns found"
        self.test_campaign_id = self.campaigns[0]['id']
        self.test_campaign_name = self.campaigns[0]['name']
        print(f"Test campaign: {self.test_campaign_name} ({self.test_campaign_id})")
        
        # Get monthly reports to find valid months
        reports_response = self.admin_session.get(f"{BASE_URL}/api/monthly-reports")
        assert reports_response.status_code == 200
        self.reports = reports_response.json()
        if len(self.reports) > 0:
            self.test_report_month = self.reports[0]['month']
        else:
            self.test_report_month = "2026-03"
        print(f"Test report month: {self.test_report_month}")
        
        # Track created disbursements for cleanup
        self.created_disbursement_ids = []
        
        yield
        
        # Cleanup - delete test disbursements
        for disb_id in self.created_disbursement_ids:
            try:
                self.admin_session.delete(f"{BASE_URL}/api/disbursements/{disb_id}")
            except:
                pass
        
        # Logout
        self.admin_session.post(f"{BASE_URL}/api/auth/logout")
        self.user_session.post(f"{BASE_URL}/api/auth/logout")
    
    # ============ GET /api/disbursements TESTS ============
    
    def test_get_disbursements_returns_200(self):
        """Test GET /api/disbursements returns 200"""
        response = self.admin_session.get(f"{BASE_URL}/api/disbursements")
        assert response.status_code == 200, f"Failed: {response.status_code} - {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"GET /api/disbursements returned {len(data)} disbursements")
    
    def test_get_disbursements_structure(self):
        """Test disbursements have expected structure"""
        response = self.admin_session.get(f"{BASE_URL}/api/disbursements")
        assert response.status_code == 200
        data = response.json()
        
        if len(data) > 0:
            required_fields = ['id', 'campaign_id', 'report_month', 'amount', 'date', 'transfer_mode']
            for field in required_fields:
                assert field in data[0], f"Missing field: {field}"
            print(f"Disbursement structure verified: {list(data[0].keys())}")
    
    def test_get_disbursements_filter_by_campaign(self):
        """Test filtering disbursements by campaign_id"""
        response = self.admin_session.get(f"{BASE_URL}/api/disbursements?campaign_id={self.test_campaign_id}")
        assert response.status_code == 200
        data = response.json()
        
        for disb in data:
            assert disb['campaign_id'] == self.test_campaign_id, f"Filter failed: got {disb['campaign_id']}"
        print(f"Campaign filter works: {len(data)} disbursements for campaign")
    
    def test_get_disbursements_filter_by_month(self):
        """Test filtering disbursements by report_month"""
        response = self.admin_session.get(f"{BASE_URL}/api/disbursements?report_month={self.test_report_month}")
        assert response.status_code == 200
        data = response.json()
        
        for disb in data:
            assert disb['report_month'] == self.test_report_month, f"Filter failed: got {disb['report_month']}"
        print(f"Month filter works: {len(data)} disbursements for {self.test_report_month}")
    
    def test_user_can_view_disbursements(self):
        """Test regular user can view disbursements"""
        response = self.user_session.get(f"{BASE_URL}/api/disbursements")
        assert response.status_code == 200, f"User should be able to view: {response.status_code}"
        print("User can view disbursements - PASS")
    
    # ============ GET /api/disbursements/summary TESTS ============
    
    def test_get_summary_returns_200(self):
        """Test GET /api/disbursements/summary returns 200"""
        response = self.admin_session.get(f"{BASE_URL}/api/disbursements/summary")
        assert response.status_code == 200, f"Failed: {response.status_code} - {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"GET /api/disbursements/summary returned {len(data)} entries")
    
    def test_summary_structure(self):
        """Test summary has expected structure"""
        response = self.admin_session.get(f"{BASE_URL}/api/disbursements/summary")
        assert response.status_code == 200
        data = response.json()
        
        if len(data) > 0:
            required_fields = ['campaign_id', 'campaign_name', 'month', 'funds_to_give', 'total_disbursed', 'balance']
            for field in required_fields:
                assert field in data[0], f"Missing field: {field}"
            print(f"Summary structure verified: {list(data[0].keys())}")
    
    def test_summary_balance_calculation(self):
        """Test balance = funds_to_give - total_disbursed"""
        response = self.admin_session.get(f"{BASE_URL}/api/disbursements/summary")
        assert response.status_code == 200
        data = response.json()
        
        for entry in data[:5]:  # Check first 5
            expected_balance = round(entry['funds_to_give'] - entry['total_disbursed'], 2)
            actual_balance = round(entry['balance'], 2)
            assert abs(expected_balance - actual_balance) < 0.01, \
                f"Balance mismatch: expected {expected_balance}, got {actual_balance}"
        print("Balance calculation verified")
    
    def test_summary_filter_by_campaign(self):
        """Test filtering summary by campaign_id"""
        response = self.admin_session.get(f"{BASE_URL}/api/disbursements/summary?campaign_id={self.test_campaign_id}")
        assert response.status_code == 200
        data = response.json()
        
        for entry in data:
            assert entry['campaign_id'] == self.test_campaign_id
        print(f"Summary campaign filter works: {len(data)} entries")
    
    def test_user_can_view_summary(self):
        """Test regular user can view summary"""
        response = self.user_session.get(f"{BASE_URL}/api/disbursements/summary")
        assert response.status_code == 200, f"User should be able to view: {response.status_code}"
        print("User can view summary - PASS")
    
    # ============ POST /api/disbursements TESTS ============
    
    def test_admin_can_create_disbursement(self):
        """Test admin can create a disbursement"""
        payload = {
            "campaign_id": self.test_campaign_id,
            "report_month": self.test_report_month,
            "amount": 1000.50,
            "date": "2026-03-15",
            "transfer_mode": "UPI",
            "remarks": "TEST_disbursement_create"
        }
        response = self.admin_session.post(f"{BASE_URL}/api/disbursements", json=payload)
        assert response.status_code == 200, f"Create failed: {response.status_code} - {response.text}"
        
        data = response.json()
        assert 'id' in data, "Response should contain id"
        assert data['amount'] == 1000.50, f"Amount mismatch: {data['amount']}"
        assert data['transfer_mode'] == "UPI", f"Transfer mode mismatch: {data['transfer_mode']}"
        
        self.created_disbursement_ids.append(data['id'])
        print(f"Admin created disbursement: {data['id']}")
    
    def test_user_cannot_create_disbursement(self):
        """Test regular user cannot create disbursement (403)"""
        payload = {
            "campaign_id": self.test_campaign_id,
            "report_month": self.test_report_month,
            "amount": 500,
            "date": "2026-03-15",
            "transfer_mode": "Cash",
            "remarks": "TEST_user_attempt"
        }
        response = self.user_session.post(f"{BASE_URL}/api/disbursements", json=payload)
        assert response.status_code == 403, f"Expected 403, got: {response.status_code}"
        print("User cannot create disbursement - PASS (403)")
    
    def test_create_disbursement_validates_amount(self):
        """Test amount must be greater than 0"""
        payload = {
            "campaign_id": self.test_campaign_id,
            "report_month": self.test_report_month,
            "amount": 0,
            "date": "2026-03-15",
            "transfer_mode": "UPI",
            "remarks": "TEST_zero_amount"
        }
        response = self.admin_session.post(f"{BASE_URL}/api/disbursements", json=payload)
        assert response.status_code == 422, f"Expected 422 for zero amount, got: {response.status_code}"
        print("Amount validation works - PASS")
    
    def test_create_disbursement_invalid_campaign(self):
        """Test creating disbursement with invalid campaign returns 404"""
        payload = {
            "campaign_id": "invalid_campaign_id",
            "report_month": self.test_report_month,
            "amount": 1000,
            "date": "2026-03-15",
            "transfer_mode": "UPI",
            "remarks": "TEST_invalid_campaign"
        }
        response = self.admin_session.post(f"{BASE_URL}/api/disbursements", json=payload)
        assert response.status_code == 404, f"Expected 404, got: {response.status_code}"
        print("Invalid campaign returns 404 - PASS")
    
    def test_create_disbursement_all_transfer_modes(self):
        """Test creating disbursements with all transfer modes"""
        transfer_modes = ['Bank Transfer (NEFT/RTGS/IMPS)', 'UPI', 'Cheque', 'Cash', 'Other']
        
        for mode in transfer_modes:
            payload = {
                "campaign_id": self.test_campaign_id,
                "report_month": self.test_report_month,
                "amount": 100,
                "date": "2026-03-15",
                "transfer_mode": mode,
                "remarks": f"TEST_{mode.replace(' ', '_')}"
            }
            response = self.admin_session.post(f"{BASE_URL}/api/disbursements", json=payload)
            assert response.status_code == 200, f"Failed for mode {mode}: {response.status_code}"
            self.created_disbursement_ids.append(response.json()['id'])
            print(f"Transfer mode '{mode}' - PASS")
    
    # ============ PUT /api/disbursements/{id} TESTS ============
    
    def test_admin_can_update_disbursement(self):
        """Test admin can update a disbursement"""
        # First create a disbursement
        create_payload = {
            "campaign_id": self.test_campaign_id,
            "report_month": self.test_report_month,
            "amount": 2000,
            "date": "2026-03-20",
            "transfer_mode": "Cash",
            "remarks": "TEST_to_update"
        }
        create_response = self.admin_session.post(f"{BASE_URL}/api/disbursements", json=create_payload)
        assert create_response.status_code == 200
        disb_id = create_response.json()['id']
        self.created_disbursement_ids.append(disb_id)
        
        # Update it
        update_payload = {
            "amount": 2500,
            "transfer_mode": "UPI",
            "remarks": "TEST_updated"
        }
        update_response = self.admin_session.put(f"{BASE_URL}/api/disbursements/{disb_id}", json=update_payload)
        assert update_response.status_code == 200, f"Update failed: {update_response.status_code}"
        
        updated_data = update_response.json()
        assert updated_data['amount'] == 2500, f"Amount not updated: {updated_data['amount']}"
        assert updated_data['transfer_mode'] == "UPI", f"Transfer mode not updated"
        assert updated_data['remarks'] == "TEST_updated", f"Remarks not updated"
        print(f"Admin updated disbursement: {disb_id}")
    
    def test_user_cannot_update_disbursement(self):
        """Test regular user cannot update disbursement (403)"""
        # First create a disbursement as admin
        create_payload = {
            "campaign_id": self.test_campaign_id,
            "report_month": self.test_report_month,
            "amount": 1500,
            "date": "2026-03-21",
            "transfer_mode": "Cheque",
            "remarks": "TEST_user_update_attempt"
        }
        create_response = self.admin_session.post(f"{BASE_URL}/api/disbursements", json=create_payload)
        assert create_response.status_code == 200
        disb_id = create_response.json()['id']
        self.created_disbursement_ids.append(disb_id)
        
        # Try to update as user
        update_payload = {"amount": 9999}
        update_response = self.user_session.put(f"{BASE_URL}/api/disbursements/{disb_id}", json=update_payload)
        assert update_response.status_code == 403, f"Expected 403, got: {update_response.status_code}"
        print("User cannot update disbursement - PASS (403)")
    
    def test_update_nonexistent_disbursement(self):
        """Test updating non-existent disbursement returns 404"""
        update_payload = {"amount": 1000}
        response = self.admin_session.put(f"{BASE_URL}/api/disbursements/nonexistent_id", json=update_payload)
        assert response.status_code == 404, f"Expected 404, got: {response.status_code}"
        print("Update non-existent returns 404 - PASS")
    
    # ============ DELETE /api/disbursements/{id} TESTS ============
    
    def test_admin_can_delete_disbursement(self):
        """Test admin can delete a disbursement"""
        # First create a disbursement
        create_payload = {
            "campaign_id": self.test_campaign_id,
            "report_month": self.test_report_month,
            "amount": 3000,
            "date": "2026-03-22",
            "transfer_mode": "Other",
            "remarks": "TEST_to_delete"
        }
        create_response = self.admin_session.post(f"{BASE_URL}/api/disbursements", json=create_payload)
        assert create_response.status_code == 200
        disb_id = create_response.json()['id']
        
        # Delete it
        delete_response = self.admin_session.delete(f"{BASE_URL}/api/disbursements/{disb_id}")
        assert delete_response.status_code == 200, f"Delete failed: {delete_response.status_code}"
        
        # Verify it's deleted
        get_response = self.admin_session.get(f"{BASE_URL}/api/disbursements")
        disbursements = get_response.json()
        ids = [d['id'] for d in disbursements]
        assert disb_id not in ids, "Disbursement should be deleted"
        print(f"Admin deleted disbursement: {disb_id}")
    
    def test_user_cannot_delete_disbursement(self):
        """Test regular user cannot delete disbursement (403)"""
        # First create a disbursement as admin
        create_payload = {
            "campaign_id": self.test_campaign_id,
            "report_month": self.test_report_month,
            "amount": 1200,
            "date": "2026-03-23",
            "transfer_mode": "Bank Transfer (NEFT/RTGS/IMPS)",
            "remarks": "TEST_user_delete_attempt"
        }
        create_response = self.admin_session.post(f"{BASE_URL}/api/disbursements", json=create_payload)
        assert create_response.status_code == 200
        disb_id = create_response.json()['id']
        self.created_disbursement_ids.append(disb_id)
        
        # Try to delete as user
        delete_response = self.user_session.delete(f"{BASE_URL}/api/disbursements/{disb_id}")
        assert delete_response.status_code == 403, f"Expected 403, got: {delete_response.status_code}"
        print("User cannot delete disbursement - PASS (403)")
    
    def test_delete_nonexistent_disbursement(self):
        """Test deleting non-existent disbursement returns 404"""
        response = self.admin_session.delete(f"{BASE_URL}/api/disbursements/nonexistent_id")
        assert response.status_code == 404, f"Expected 404, got: {response.status_code}"
        print("Delete non-existent returns 404 - PASS")
    
    # ============ AUTHENTICATION TESTS ============
    
    def test_disbursements_requires_auth(self):
        """Test disbursements endpoint requires authentication"""
        new_session = requests.Session()
        response = new_session.get(f"{BASE_URL}/api/disbursements")
        assert response.status_code == 401, f"Expected 401, got: {response.status_code}"
        print("Disbursements requires auth - PASS")
    
    def test_summary_requires_auth(self):
        """Test summary endpoint requires authentication"""
        new_session = requests.Session()
        response = new_session.get(f"{BASE_URL}/api/disbursements/summary")
        assert response.status_code == 401, f"Expected 401, got: {response.status_code}"
        print("Summary requires auth - PASS")
    
    # ============ INTEGRATION TESTS ============
    
    def test_create_disbursement_updates_summary(self):
        """Test creating a disbursement updates the summary correctly"""
        # Get initial summary
        initial_summary = self.admin_session.get(
            f"{BASE_URL}/api/disbursements/summary?campaign_id={self.test_campaign_id}&report_month={self.test_report_month}"
        ).json()
        
        initial_disbursed = 0
        if len(initial_summary) > 0:
            initial_disbursed = initial_summary[0]['total_disbursed']
        
        # Create a disbursement
        create_payload = {
            "campaign_id": self.test_campaign_id,
            "report_month": self.test_report_month,
            "amount": 5000,
            "date": "2026-03-25",
            "transfer_mode": "UPI",
            "remarks": "TEST_summary_update"
        }
        create_response = self.admin_session.post(f"{BASE_URL}/api/disbursements", json=create_payload)
        assert create_response.status_code == 200
        disb_id = create_response.json()['id']
        self.created_disbursement_ids.append(disb_id)
        
        # Get updated summary
        updated_summary = self.admin_session.get(
            f"{BASE_URL}/api/disbursements/summary?campaign_id={self.test_campaign_id}&report_month={self.test_report_month}"
        ).json()
        
        if len(updated_summary) > 0:
            updated_disbursed = updated_summary[0]['total_disbursed']
            expected_disbursed = initial_disbursed + 5000
            assert abs(updated_disbursed - expected_disbursed) < 0.01, \
                f"Summary not updated: expected {expected_disbursed}, got {updated_disbursed}"
            print(f"Summary updated correctly: {initial_disbursed} -> {updated_disbursed}")


class TestDisbursementDataValidation:
    """Test data validation for disbursements"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - login as admin"""
        self.session = requests.Session()
        login = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@umeednow.org",
            "password": "admin123"
        })
        assert login.status_code == 200
        
        # Get a valid campaign
        campaigns = self.session.get(f"{BASE_URL}/api/campaigns").json()
        self.campaign_id = campaigns[0]['id'] if campaigns else None
        
        self.created_ids = []
        yield
        
        for id in self.created_ids:
            try:
                self.session.delete(f"{BASE_URL}/api/disbursements/{id}")
            except:
                pass
        self.session.post(f"{BASE_URL}/api/auth/logout")
    
    def test_negative_amount_rejected(self):
        """Test negative amount is rejected"""
        payload = {
            "campaign_id": self.campaign_id,
            "report_month": "2026-03",
            "amount": -100,
            "date": "2026-03-15",
            "transfer_mode": "UPI",
            "remarks": "TEST_negative"
        }
        response = self.session.post(f"{BASE_URL}/api/disbursements", json=payload)
        assert response.status_code == 422, f"Expected 422 for negative amount, got: {response.status_code}"
        print("Negative amount rejected - PASS")
    
    def test_missing_required_fields(self):
        """Test missing required fields are rejected"""
        # Missing campaign_id
        payload = {
            "report_month": "2026-03",
            "amount": 100,
            "date": "2026-03-15",
            "transfer_mode": "UPI"
        }
        response = self.session.post(f"{BASE_URL}/api/disbursements", json=payload)
        assert response.status_code == 422, f"Expected 422 for missing campaign_id, got: {response.status_code}"
        print("Missing required fields rejected - PASS")
    
    def test_remarks_optional(self):
        """Test remarks field is optional"""
        payload = {
            "campaign_id": self.campaign_id,
            "report_month": "2026-03",
            "amount": 100,
            "date": "2026-03-15",
            "transfer_mode": "Cash"
            # No remarks
        }
        response = self.session.post(f"{BASE_URL}/api/disbursements", json=payload)
        assert response.status_code == 200, f"Should accept without remarks: {response.status_code}"
        self.created_ids.append(response.json()['id'])
        print("Remarks optional - PASS")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
