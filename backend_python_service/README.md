# Python Backend Service

This is the secondary backend service, built with FastAPI and Python.

## 🚀 Technologies

*   **Framework**: FastAPI
*   **Database**: MongoDB (via Motor & Beanie ODM)
*   **Testing**: Pytest
*   **Linting**: Mypy
*   **Package Manager**: pip

## 🛠 Setup & Installation

### Prerequisites
*   Python 3.10+
*   MongoDB

### Installation

1.  Create a virtual environment:
    `ash
    python -m venv venv
    `
2.  Activate the virtual environment:
    *   Windows: .\venv\Scripts\Activate
    *   Linux/Mac: source venv/bin/activate
3.  Install dependencies:
    `ash
    pip install -r requirements.txt
    `

## 🏃‍♂️ Running the Service

### Start Server
Runs the FastAPI app on port 5000 (default).

`ash
python app/main.py
`

### Seed Data
Populates the database with initial users and todos.

`ash
python seed.py
`

## 🧪 Testing

Runs the test suite using Pytest.

`ash
pytest
`

## 🧹 Linting

Runs static type checking using Mypy.

`ash
mypy app
`

## ⚙️ Configuration
Settings are loaded from `config.dev.yaml` (default) or `config.prod.yaml`.

### Configuration Parameters

| Parameter | Description | Example |
| :--- | :--- | :--- |
| `Jwt.Key` | Secret key used for signing JWT tokens. **Change this in production.** | `your-super-secret-key...` |
| `Jwt.TimeoutMinutes` | Token expiration time in minutes. | `30` |
| `ConnectionStrings.MongoConnection` | MongoDB connection string. | `mongodb://localhost:27017/react-py-todo-app` |
| `Server.Urls` | URLs the server listens on. | `http://localhost:5000;https://localhost:5001` |
| `Cors.AllowedOrigins` | Comma-separated list of allowed CORS origins. | `http://localhost:3000,http://localhost:5173` |

## API Documentation with Swagger

When running in development mode, the API provides interactive documentation via Swagger UI.

### Accessing Swagger UI

Start the application in development mode

Open your browser and navigate to:
- for swagger API http://127.0.0.1:5000/docs#/
- for fastAPI http://127.0.0.1:5000/redoc#/

The Swagger UI will display all available endpoints with their parameters and response schemas

You can test endpoints directly from the UI by clicking "Try it out"

OpenAPI Specification

The OpenAPI JSON specification is available at: http://localhost:5000/openapi.json or https://localhost:5001/openapi.json

## 📂 Project Structure

```text
backend_python_service/
├── app/                    # Application source code
│   ├── routes/             # API route definitions
│   ├── __init__.py         # Package initialization
│   ├── auth.py             # Authentication logic and utilities
│   ├── config.py           # Configuration loading and management
│   ├── database.py         # Database connection and initialization
│   ├── main.py             # Application entry point
│   └── models.py           # Database models (Beanie/Pydantic)
├── tests/                  # Test suite
│   ├── conftest.py         # Pytest fixtures and configuration
│   ├── test_api.py         # General API tests
│   ├── test_check_users.py # User verification tests
│   └── test_login.py       # Authentication tests
├── config.dev.yaml         # Development configuration settings
├── config.prod.yaml        # Production configuration settings
├── pnpm-lock.yaml          # Lock file (if used in workspace)
├── pytest.ini              # Pytest configuration
├── readme.md               # Project documentation
└── seed.py                 # Database seeding script
```
