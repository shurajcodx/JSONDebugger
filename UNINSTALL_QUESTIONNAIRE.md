# JSON Debugger - Uninstall Feedback Questionnaire

This document contains the complete questionnaire setup for gathering user feedback when someone uninstalls the JSON Debugger Chrome Extension.

---

## 📋 Recommended Form Structure

### Form Title
**JSON Debugger — Help Us Improve**

### Form Description
*We're sorry to see you go! Please take 30 seconds to tell us why JSON Debugger didn't fit your workflow so we can make it better.*

---

## ❓ Survey Questions

### Question 1: Primary Reason for Uninstalling *(Required - Multiple Choice)*
**Question Text:** What is the main reason you are uninstalling JSON Debugger?

**Options:**
- [ ] **Didn't work on my website / couldn't detect JSON** *(Triggers follow-up Q2a)*
- [ ] **Missing a feature I needed** *(Triggers follow-up Q2b)*
- [ ] **Found a better tool/extension** *(Triggers follow-up Q2c)*
- [ ] **Hard to use / confusing interface**
- [ ] **Performance issue / slowed down pages**
- [ ] **Just temporary use / cleaning up extensions**
- [ ] **Other** *(With text field)*

---

### Question 2: Specific Follow-up Details *(Optional - Short Answer / Text)*

*Choose the appropriate follow-up based on Q1 response:*

#### 2a. If "Didn't work on my website":
- **Prompt:** Which URL or framework was JSON Debugger unable to detect or parse?
- **Placeholder:** *e.g., https://api.example.com/data or Next.js / GraphQL API*

#### 2b. If "Missing a feature":
- **Prompt:** Which feature were you hoping to see in JSON Debugger?
- **Placeholder:** *e.g., GraphQL formatting, Export to CSV, Mock API server, Dark theme adjustments*

#### 2c. If "Found a better tool/extension":
- **Prompt:** Which tool or extension did you switch to, and what does it do better?
- **Placeholder:** *e.g., JSON Formatter, Postman, native DevTools Network tab*

---

### Question 3: Open Feedback *(Optional - Long Text)*
**Question Text:** Any other feedback, bugs, or suggestions you'd like to share with the developer?

**Placeholder:** *Feel free to share any thoughts or details here...*

---

### Question 4: Contact for Follow-Up *(Optional - Short Text / Email)*
**Question Text:** Want us to notify you when the issue is fixed or requested feature is added? Leave your email (optional).

**Placeholder:** *yourname@example.com*

---

## 🛠️ How to Set Up Your Form

### Option A: Google Forms (Free & Quick)
1. Go to [Google Forms](https://forms.google.com) and create a **Blank Form**.
2. Copy the Title, Description, and Questions from above.
3. Click **Send** (top right) -> Copy the short `https://forms.gle/...` link.
4. Paste the link into `UNINSTALL_FEEDBACK_URL` in [`extension/background/background.js`](file:///Users/shurajcodx/projects/shurajcodx/sidehustle/chrome-extension/JSONDebugger/extension/background/background.js).

---

### Option B: Tally.so (Modern & High Conversion)
1. Go to [Tally.so](https://tally.so) and create a free form.
2. Type `/` to insert multiple-choice and short text fields matching the questions above.
3. Publish and copy your form link (`https://tally.so/r/...`).
4. Paste the link into [`extension/background/background.js`](file:///Users/shurajcodx/projects/shurajcodx/sidehustle/chrome-extension/JSONDebugger/extension/background/background.js).

---

## 🔗 Code Link Location

In `extension/background/background.js`:
```javascript
const UNINSTALL_FEEDBACK_URL = "https://forms.gle/YOUR_FORM_ID_HERE";
```
