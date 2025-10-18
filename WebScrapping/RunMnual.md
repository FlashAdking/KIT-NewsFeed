# Running the Web Scraping Service

## 📋 Prerequisites

**Ensure the project has been cloned from the repository**

---

## Setup Instructions

### Step 1: Navigate to Web Scraping Directory
```bash
cd WebScrapping/backend
```

### Step 2: Verify Python Version (3.12+ Required)
```bash
# For Windows
python --version

# OR

# For Linux/Mac
python3 --version
```

### Step 3: Create Virtual Environment (Recommended)
```bash
# For Windows
python -m venv <YOUR_ENV_NAME>

# OR

# For Linux/Mac
python3 -m venv <YOUR_ENV_NAME>
```

### Step 4: Activate Virtual Environment

**⚠️ Skip this step if you didn't create a virtual environment**

```bash
# For Windows (PowerShell)
<YOUR_ENV_NAME>\Scripts\Activate.ps1

# For Windows (Command Prompt)
<YOUR_ENV_NAME>\Scripts\activate.bat

# For Linux/Mac
source <YOUR_ENV_NAME>/bin/activate
```

### Step 5: Install Dependencies
```bash
# Install from requirements file
pip install -r req.txt
```

**Note:** If not using virtual environment, packages will be installed globally.

### Step 6: Verify Installation
```bash
# Check installed packages
pip list
```

### Step 7: Start Web Scraping Service
```bash
uvicorn backend:app --reload
```

---

## ✅ Expected Result

- Service will start on [**http://localhost:8000**](http://localhost:8000) (default uvicorn port)
- Check terminal logs to confirm the server address
- API will auto-reload on code changes (due to `--reload` flag)

---

## 📝 Note

- **Port may vary** depending on availability
- Using virtual environment is **highly recommended** to avoid package conflicts
- The `--reload` flag enables hot-reloading during development
