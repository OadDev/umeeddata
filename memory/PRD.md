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
- [x] Daily entries table
- [x] Summary with totals

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
- [ ] Password change functionality
- [ ] Forgot password flow
- [ ] Data export to Excel

### P2 (Medium Priority)
- [ ] Dashboard date range selector
- [ ] Email notifications for settlements
- [ ] Audit log for changes
- [ ] Campaign archiving

### P3 (Low Priority)
- [ ] Dark mode toggle
- [ ] Dashboard customization
- [ ] Bulk entry import (CSV)
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
2. Implement forgot password flow
3. Add Excel export option
4. Dashboard date range selector
