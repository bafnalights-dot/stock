# Bafna Light's - Data Backup & Recovery Guide

## 📋 IMPORTANT: Read This First!

Your data is stored in a MongoDB database. This guide will help you:
1. Backup your data regularly
2. Restore data if something goes wrong
3. Troubleshoot common issues

---

## 🔄 AUTOMATIC DAILY BACKUP (Manual Setup Required)

### Option 1: Export Excel Daily (Recommended for Now)
**Every day at end of business:**
1. Open the app
2. Go to Reports tab
3. Tap "Download Excel Report"
4. Save to Google Drive manually
5. Rename file with date: `bafna_backup_2026-01-29.xlsx`

**This gives you:**
- All items and stock levels
- All production records
- All sales records
- All purchase records

---

## 💾 MANUAL DATABASE BACKUP

### How to Backup Database (MongoDB)

**On your computer/server where the app is running:**

```bash
# Backup entire database
mongodump --db=bafna_lights --out=/backup/bafna_$(date +%Y%m%d)

# This creates a folder with all your data
```

**Important Files:**
- `/backup/bafna_YYYYMMDD/` - Contains all database files

### How to Restore Database

```bash
# Restore from backup
mongorestore --db=bafna_lights /backup/bafna_20260129/bafna_lights/

# This restores all your data
```

---

## 🔧 TROUBLESHOOTING GUIDE

### Problem 1: App Not Loading / Blank Screen

**Solution:**
```bash
# Restart the application
sudo supervisorctl restart backend
sudo supervisorctl restart expo

# Wait 20 seconds, then refresh your browser/app
```

### Problem 2: "Cannot Connect to Server" Error

**Check if backend is running:**
```bash
sudo supervisorctl status backend

# If it says "STOPPED", restart it:
sudo supervisorctl start backend
```

### Problem 3: Production/Sales Not Saving

**Check backend logs:**
```bash
tail -50 /var/log/supervisor/backend.err.log

# Look for ERROR messages
# If you see database connection errors, restart:
sudo supervisorctl restart backend
```

### Problem 4: Parts Stock Not Deducting

**Check if parts exist in database:**
```bash
curl http://localhost:8001/api/part-stocks

# Should show list of parts with stock levels
# If empty, you need to add parts via Purchase tab
```

### Problem 5: Excel Download Not Working

**Test download manually:**
```bash
curl -X GET http://localhost:8001/api/export/excel -o /tmp/test.xlsx

# If this works, the problem is in the mobile app
# Try using the web version on a computer
```

---

## 📱 DATA RECOVERY SCENARIOS

### Scenario 1: Accidentally Deleted Items/Parts

**If you have Excel backup:**
1. Open latest Excel backup
2. Re-enter items manually in Items tab
3. Re-enter opening stock via Purchase tab

**If you have database backup:**
```bash
# Stop the app
sudo supervisorctl stop backend expo

# Restore database
mongorestore --db=bafna_lights --drop /backup/bafna_YYYYMMDD/bafna_lights/

# Start the app
sudo supervisorctl start backend expo
```

### Scenario 2: Wrong Production/Sales Entries

**Current System:**
- No delete function (by design for audit trail)
- You need to add correcting entries

**Example:**
- Wrong: Entered 100 units production instead of 10
- Fix: Record -90 units (contact developer to enable negative entries)

### Scenario 3: Complete Data Loss

**Recovery Steps:**
1. Get latest Excel backup from Google Drive
2. Reset database: `curl -X POST http://localhost:8001/api/reset-database`
3. Re-enter all items from Excel backup
4. Re-enter opening stock
5. Continue from current date

---

## 🚨 EMERGENCY CONTACTS

### If App Completely Stops Working:

**Step 1: Check Services**
```bash
sudo supervisorctl status
```

**Step 2: Restart Everything**
```bash
sudo supervisorctl restart all
```

**Step 3: Check if Database is Running**
```bash
mongo --eval "db.adminCommand('ping')"
```

**Step 4: Get Help**
- Check error logs: `/var/log/supervisor/*.log`
- Contact your developer with:
  - Screenshots of error
  - Last 50 lines of backend.err.log
  - What action caused the error

---

## 💡 BEST PRACTICES

### Daily:
✅ Export Excel at end of day
✅ Save to Google Drive with date in filename

### Weekly:
✅ Keep last 7 days of Excel backups
✅ Delete older backups to save space

### Monthly:
✅ Take full database backup
✅ Test restore process on test environment

---

## 📊 DATA LOCATIONS

**Database:**
- Location: MongoDB running in Docker container
- Database Name: `bafna_lights`
- Collections: items, part_stocks, production, sales, purchases

**Application Files:**
- Backend: `/app/backend/server.py`
- Frontend: `/app/frontend/app/`
- Config: `/app/backend/.env`, `/app/frontend/.env`

**Logs:**
- Backend Errors: `/var/log/supervisor/backend.err.log`
- Backend Output: `/var/log/supervisor/backend.out.log`
- Frontend Errors: `/var/log/supervisor/expo.err.log`

---

## 🔐 IMPORTANT NOTES

1. **Never delete the database manually** unless you have a backup
2. **Always test restore process** with old backups first
3. **Keep at least 7 days of Excel backups** in Google Drive
4. **Take screenshot of Reports page daily** as additional backup
5. **Excel backup is your lifeline** - do it daily!

---

## 📞 DEVELOPER CONTACT

If you cannot resolve an issue:
1. Don't panic - your Excel backups have all data
2. Take screenshots of errors
3. Note what you were doing when error occurred
4. Contact developer with above information
5. DO NOT try to fix database manually

---

## ✅ RECOVERY CHECKLIST

Before making any changes:
- [ ] Have latest Excel backup?
- [ ] Know which data you need to recover?
- [ ] Tested on small dataset first?
- [ ] Have someone else verify the data?
- [ ] Saved current state before restoring?

Remember: **Excel Backup = Your Insurance Policy**
