# Google Drive Auto-Upload Setup Guide for Bafna Light's

## 📋 What You'll Need:
- Google Account (bafnalights@gmail.com)
- 15-20 minutes
- Access to Google Cloud Console

---

## 🎯 STEP 1: Create Google Cloud Project

### 1.1 Go to Google Cloud Console
- Open browser
- Go to: **https://console.cloud.google.com**
- Sign in with: **bafnalights@gmail.com**

### 1.2 Create New Project
1. Click **"Select a project"** at the top (next to Google Cloud logo)
2. Click **"NEW PROJECT"** button (top right)
3. Fill in:
   - **Project name:** `Bafna Stock Management`
   - **Location:** Leave as default
4. Click **"CREATE"**
5. Wait 30 seconds for project to be created
6. Click **"SELECT PROJECT"** when prompted

✅ **You should now see "Bafna Stock Management" at the top**

---

## 🎯 STEP 2: Enable Google Drive API

### 2.1 Open API Library
1. On left sidebar, click **"APIs & Services"**
2. Click **"Library"**

### 2.2 Enable Drive API
1. In search box, type: **"Google Drive API"**
2. Click on **"Google Drive API"** from results
3. Click **"ENABLE"** button
4. Wait for it to enable (10-20 seconds)

✅ **You should see "API enabled" message**

---

## 🎯 STEP 3: Create Service Account

### 3.1 Go to Credentials
1. Click **"Credentials"** in left sidebar
2. Click **"CREATE CREDENTIALS"** button at top
3. Select **"Service account"**

### 3.2 Fill Service Account Details
**Page 1 - Service account details:**
1. **Service account name:** `bafna-drive-uploader`
2. **Service account ID:** (auto-filled, leave it)
3. **Description:** `Uploads stock reports to Google Drive`
4. Click **"CREATE AND CONTINUE"**

**Page 2 - Grant access (Optional):**
1. Click **"CONTINUE"** (skip this step)

**Page 3 - Grant users access (Optional):**
1. Click **"DONE"**

✅ **Service account created!**

---

## 🎯 STEP 4: Create Service Account Key

### 4.1 Find Your Service Account
1. You'll see a list of service accounts
2. Find: **bafna-drive-uploader@...**
3. Click on the **email** (it's a link)

### 4.2 Create Key
1. Click **"KEYS"** tab at top
2. Click **"ADD KEY"** button
3. Select **"Create new key"**
4. Choose **"JSON"** format
5. Click **"CREATE"**

### 4.3 Download Key File
- A file will automatically download
- Filename looks like: `bafna-stock-management-xxxxx.json`
- **KEEP THIS FILE SAFE - IT'S LIKE A PASSWORD!**

✅ **Save this file - we'll need it soon**

---

## 🎯 STEP 5: Get Service Account Email

### 5.1 Copy the Email
1. In the service account details page
2. Find **"Email"** field
3. It looks like: `bafna-drive-uploader@bafna-stock-management.iam.gserviceaccount.com`
4. **COPY THIS ENTIRE EMAIL** (we need it for next step)

✅ **Write down or copy this email address**

---

## 🎯 STEP 6: Share Google Drive Folder

### 6.1 Open Your Drive Folder
1. Go to: **https://drive.google.com**
2. Navigate to your folder or open this link:
   **https://drive.google.com/drive/folders/16S2JR4or0ZQYBnZGXzwXgntRrdqZLXEd**

### 6.2 Share with Service Account
1. Right-click on the folder
2. Click **"Share"**
3. In the "Add people and groups" box:
   - Paste the service account email (from Step 5)
   - Example: `bafna-drive-uploader@bafna-stock-management.iam.gserviceaccount.com`
4. Select permission: **"Editor"**
5. **UNCHECK** "Notify people" (service accounts don't read emails)
6. Click **"Share"** or **"Done"**

✅ **Folder is now shared with your app!**

---

## 🎯 STEP 7: Upload Key File to Server

### 7.1 Send Me the Key File
You have two options:

**Option A: Copy-Paste (Easier)**
1. Open the downloaded JSON file in Notepad/TextEdit
2. Copy ALL the content
3. Tell me: "Ready to paste key file"
4. I'll save it securely on the server

**Option B: Manual Upload (if Option A doesn't work)**
1. I'll give you a command to upload the file

---

## 📝 QUICK CHECKLIST

Before proceeding, make sure you have:

- [ ] Created Google Cloud project
- [ ] Enabled Google Drive API
- [ ] Created service account
- [ ] Downloaded JSON key file
- [ ] Copied service account email
- [ ] Shared Drive folder with service account (Editor permission)
- [ ] Have the JSON key file ready to share

---

## 🚀 WHAT HAPPENS NEXT

Once you give me the key file:

1. I'll install it on the server
2. Add Google Drive upload code to the app
3. Test the upload
4. Your Reports tab will have:
   - **"Download Excel"** button (current)
   - **"Upload to Google Drive"** button (new!)

When you tap "Upload to Google Drive":
- Excel file created
- Uploaded to your folder automatically
- Named: `bafna_lights_2026-01-30.xlsx`
- Success message shown

---

## ⚠️ IMPORTANT NOTES

**Security:**
- The JSON key file is like a password
- Only share it with me (in this secure session)
- Don't post it publicly
- I'll store it encrypted on your server

**Folder Access:**
- Service account can ONLY access folders you share with it
- It cannot see your other Drive files
- It's completely safe

**Cost:**
- Google Drive API is FREE for your usage level
- No charges for uploading reports

---

## 💬 READY?

Once you complete Steps 1-6, tell me:

1. "I've completed the setup"
2. Share the JSON key file content (copy-paste)

Or if you get stuck anywhere, tell me which step and I'll help!

---

## 🆘 TROUBLESHOOTING

**"Can't find APIs & Services"**
- Look in the left hamburger menu (☰)
- Scroll down to find it

**"Service account email looks wrong"**
- It's supposed to be very long
- Format: name@project-id.iam.gserviceaccount.com
- This is correct!

**"Folder share not working"**
- Make sure you pasted the FULL email address
- Make sure you clicked "Share" or "Done"
- Permission must be "Editor" not "Viewer"

**"Don't see the JSON download"**
- Check your Downloads folder
- Look for a file with .json extension
- Re-create the key if needed
