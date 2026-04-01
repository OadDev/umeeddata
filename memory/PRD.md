# Umeed Now Foundation - Campaign Finance Management System

## Overview
Internal web application for managing crowdfunding campaign finances, replacing Excel-based workflow.

## User Personas
1. **Admin**: Full access to all features including settings, user management, settlements
2. **User**: Can create campaigns, add daily entries, view reports but cannot edit/delete or access admin features

## Core Requirements (Static)
- Campaign management with commission distribution (4 stakeholders)
- Daily entry tracking (Ad Spend, Website Collection, QR Collection)
- Monthly settlements (Ad Account Charges, Miscellaneous Expenses)
- Automatic calculations (GST, Gateway charges, Net Profit, Commission)
- PDF report generation
- Role-based access control
- Mobile responsive design

## Architecture
- **Frontend**: React with Tailwind CSS, Shadcn/UI components, Recharts for visualization
- **Backend**: FastAPI with Python
- **Database**: MongoDB
- **Authentication**: JWT with httpOnly cookies

## What's Been Implemented (March 31, 2026)

### Authentication & Authorization
- [x] JWT-based login/logout
- [x] Role-based access (Admin/User)
- [x] Protected routes
- [x] Brute force protection

### Campaign Management
- [x] Create/Edit/Delete campaigns
- [x] Commission distribution (Company, Dev, Himanshu, Denim)
- [x] Active/Inactive status

### Daily Entries
- [x] Add entries for any date
- [x] One entry per campaign per date (unique constraint)
- [x] Automatic calculation of all financial fields
- [x] Edit/Delete (Admin only)
- [x] Filtering by campaign and date range

### Monthly Settlements
- [x] Add monthly settlement data
- [x] Ad Account Charges
- [x] Miscellaneous Expenses
- [x] Notes field

### Dashboard
- [x] Today's stats (Profit, Revenue, Ad Spend, Collections)
- [x] Revenue & Profit trend chart (30 days)
- [x] Source split pie chart (Website vs QR)
- [x] Campaign performance bar chart
- [x] Active campaign cards

### Reports
- [x] Daily reports with filters (Today, Yesterday, This Month, Custom)
- [x] Campaign filter
- [x] CSV export
- [x] Summary cards

### Monthly Reports
- [x] Campaign-wise monthly summary
- [x] Settlement status indicator
- [x] Stakeholder earnings distribution
- [x] PDF download

### Stakeholder Earnings
- [x] Total earnings per stakeholder
- [x] Distribution pie chart
- [x] Monthly trend bar chart
- [x] Monthly breakdown table
- [x] Campaign filter

### Settings (Admin)
- [x] GST percentage
- [x] Gateway charge percentage
- [x] Calculation preview

### User Management (Admin)
- [x] Create new users
- [x] Delete users
- [x] Role assignment

### PDF Generation
- [x] Server-side PDF with ReportLab
- [x] Campaign header with settings
- [x] Daily entries table (10 columns, landscape A4)
- [x] Summary with totals
- [x] Column layout fixed - all columns visible without clipping

### Excel Export (April 1, 2026)
- [x] Server-side Excel with openpyxl
- [x] Title section with campaign name and month
- [x] Daily entries table with 10 columns
- [x] Totals row with bold formatting
- [x] Summary section with Net Profit, Commission, Charges, Funds to Give
- [x] Color-coded headers (green theme) and cell borders
- [x] Download button alongside PDF on Monthly Reports page

### Fund Disbursements (April 1, 2026)
- [x] Track fund disbursements per campaign per month
- [x] CRUD endpoints (admin create/edit/delete, user view-only)
- [x] Transfer modes: Bank Transfer (NEFT/RTGS/IMPS), UPI, Cheque, Cash, Other
- [x] Summary with Funds to Give, Total Disbursed, Balance Remaining
- [x] Balance Overview table with Pending/Partial/Fully Paid status badges
- [x] Transaction History table with date, amount, mode, remarks
- [x] Campaign and month filters
- [x] Add/Edit dialog with form validation
- [x] Delete confirmation dialog
- [x] Role-based: admin sees edit/delete, user only views

### UI/UX
- [x] Mobile responsive design
- [x] Umeed Now Foundation branding
- [x] Green (#6AAF35) & Orange (#F5A623) color scheme
- [x] Work Sans + IBM Plex Sans fonts
- [x] Phosphor Icons
- [x] Shadcn/UI components

## Prioritized Backlog

### P0 (Critical) - None

### P1 (High Priority)
- [x] Data export to Excel (Completed April 1, 2026)
- [x] Fund Disbursement tracking (Completed April 1, 2026)
- [ ] Password change functionality
- [ ] Forgot password flow

### P2 (Medium Priority)
- [ ] Dashboard date range selector
- [ ] Email notifications for settlements
- [ ] Audit log for changes
- [ ] Campaign archiving

### P3 (Low Priority)
- [ ] Dark mode toggle
- [ ] Dashboard customization
- [ ] Campaign comparison reports

## Demo Data
- 3 campaigns seeded (Medical Emergency, Education Fund, Flood Relief)
- 60 days of daily entries per campaign
- 2 months of settlement data

## Test Credentials
- Admin: admin@umeednow.org / admin123
- User: user@umeednow.org / user123

## Next Tasks
1. Add password change functionality
2. Implement forgot password / password reset flow
3. Email notifications for monthly settlements
4. Dashboard date range selector
