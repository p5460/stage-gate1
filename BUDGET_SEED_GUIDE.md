# Budget Allocation Seed Guide

## 🌱 **Budget Seeding Options**

I've created comprehensive seed files to populate your database with realistic budget allocation test data.

## 📋 **Available Seed Commands**

### 1. **Simple Budget Seed** (Recommended for Testing)

```bash
npm run db:seed-budget-simple
```

**What it creates:**

- 4 budget allocations for testing (approved, pending, rejected)
- Sample expenses with different statuses
- 1 pending expense claim for approval testing
- Minimal data perfect for development and testing

### 2. **Comprehensive Budget Seed** (Full Demo Data)

```bash
npm run db:seed-budget
```

**What it creates:**

- Budget allocations for ALL existing projects
- 3-6 budget categories per project
- Realistic amounts based on category types
- 70% approved, 20% pending, 10% rejected allocations
- Expense records with spending history
- Pending approvals for demonstration

### 3. **Full System Seed** (Complete Setup)

```bash
npm run db:seed-full
```

**What it includes:**

- Basic users and projects
- Additional multi-reviewer users
- Complete budget allocation system data
- Ready-to-use demo environment

## 💰 **Budget Categories Included**

### Personnel:

- **Salaries**: R500,000 (base amount)
- **Benefits**: R100,000
- **Consultants**: R200,000

### Equipment:

- **Laboratory Equipment**: R300,000
- **Computing Equipment**: R150,000
- **Software**: R50,000

### Materials:

- **Consumables**: R75,000
- **Chemicals**: R100,000

### Travel:

- **Domestic Travel**: R50,000
- **International Travel**: R120,000

### Overhead:

- **Administrative Costs**: R80,000

### Other Direct Costs:

- **Publication Fees**: R25,000

## 📊 **What You'll Get**

### Budget Allocations:

- **Approved**: Ready for expense submissions
- **Pending**: Awaiting admin/gatekeeper approval
- **Rejected**: Examples with rejection reasons
- **Realistic amounts**: Varied by ±30% from base amounts
- **Proper descriptions**: Detailed justifications for each allocation

### Expense Records:

- **Approved expenses**: With spending history
- **Pending expenses**: Ready for approval testing
- **Realistic descriptions**: Category-appropriate expense details
- **Receipt URLs**: Mock receipt links for testing

### Approval Workflow:

- **Budget approvals**: Complete approval history
- **Comments**: Realistic approval/rejection comments
- **Timestamps**: Proper date sequences for workflow testing

## 🎯 **Usage Scenarios**

### For Development:

```bash
# Quick setup for development
npm run db:seed-budget-simple
```

- Fast seeding (< 30 seconds)
- Essential test data only
- Perfect for feature development

### For Demo/Presentation:

```bash
# Full demo environment
npm run db:seed-budget
```

- Comprehensive data set
- Multiple projects with budgets
- Realistic business scenarios

### For Complete Testing:

```bash
# Full system with all features
npm run db:seed-full
```

- Complete user roles and permissions
- Full project lifecycle data
- Comprehensive budget scenarios

## 🔍 **What to Test After Seeding**

### Admin Dashboard:

1. Visit `/admin/budget` to see pending approvals
2. Check budget statistics on admin dashboard
3. Test approval/rejection workflows

### Budget Management:

1. **View Allocations**: See different status types
2. **Approve Requests**: Process pending allocations
3. **Expense Management**: Approve expense claims
4. **Budget Tracking**: Monitor utilization

### Project Level:

1. **Budget Requests**: Create new allocations
2. **Expense Submission**: Submit expenses against approved budgets
3. **Budget Monitoring**: Track spending and remaining amounts

## 📈 **Sample Data Overview**

### Simple Seed Creates:

- 4 budget allocations (R945,000 total)
- 3 approved expenses
- 1 pending expense
- 1 pending allocation for approval testing

### Comprehensive Seed Creates:

- 30-50+ budget allocations across all projects
- R15-25 million in total budget allocations
- 50-100+ expense records
- 10-15 pending approvals for testing
- Complete approval history and workflow data

## 🚀 **Getting Started**

### Quick Start (5 minutes):

```bash
# 1. Ensure you have basic data
npm run db:seed

# 2. Add budget data
npm run db:seed-budget-simple

# 3. Visit the admin dashboard
# Go to /admin/budget
```

### Full Demo Setup (10 minutes):

```bash
# Complete setup with all features
npm run db:seed-full

# Visit /admin/budget for full demo
```

## ✅ **Verification**

After seeding, you should see:

- Budget management in admin sidebar
- Budget statistics on admin dashboard
- Pending approvals in budget management page
- Realistic budget data for testing all features

The seed data provides a complete testing environment for the budget allocation and approval system with realistic scenarios and proper workflow states!
