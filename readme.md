# DocuStream – Cloud-Native Document Processing System

> Built with Microsoft Azure | React.js | Node.js | Azure Blob Storage | Azure Functions

---

## 📁 Project Structure

```
docustream/
├── frontend/          # React.js frontend application
├── backend/           # Node.js Express backend + Azure Functions
└── README.md
```

---

## ⚙️ Prerequisites

- Node.js v18+
- npm v9+
- Azure Account (free tier works)
- Azure CLI installed → https://learn.microsoft.com/en-us/cli/azure/install-azure-cli
- Azure Functions Core Tools → `npm install -g azure-functions-core-tools@4`

---

## 🚀 Step-by-Step Setup

### Step 1 – Clone / place project files
```bash
cd docustream
```

### Step 2 – Azure Setup (one-time)
```bash
# Login to Azure
az login

# Create Resource Group
az group create --name docustream-rg --location eastus

# Create Storage Account (name must be globally unique, lowercase, 3-24 chars)
az storage account create \
  --name docustreamstore \
  --resource-group docustream-rg \
  --location eastus \
  --sku Standard_LRS

# Get Storage Connection String (copy this!)
az storage account show-connection-string \
  --name docustreamstore \
  --resource-group docustream-rg \
  --query connectionString \
  --output tsv

# Create Blob Container
az storage container create \
  --name documents \
  --account-name docustreamstore \
  --public-access off
```

### Step 3 – Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your Azure connection string
npm run dev
```

### Step 4 – Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with backend URL
npm start
```

### Step 5 – Azure Function (optional local test)
```bash
cd backend/functions
npm install
func start
```

---

## 🌐 Environment Variables

### backend/.env
```
PORT=5000
AZURE_STORAGE_CONNECTION_STRING=your_connection_string_here
AZURE_STORAGE_CONTAINER_NAME=documents
JWT_SECRET=your_jwt_secret_here
MONGODB_URI=mongodb://localhost:27017/docustream
```

### frontend/.env
```
REACT_APP_API_URL=http://localhost:5000/api
```

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, CSS3, Axios |
| Backend | Node.js, Express.js |
| Cloud Storage | Azure Blob Storage |
| Serverless | Azure Functions |
| Database | MongoDB (metadata/logs) |
| Auth | JWT |

---

## 🧪 Running Tests
```bash
cd backend && npm test
```