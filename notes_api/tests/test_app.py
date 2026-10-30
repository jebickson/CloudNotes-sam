
import json
import sys
from pathlib import Path

# Add notes_app folder to Python's import path
APP_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(APP_DIR))

import app


def test_response_returns_json():
    result = app.response(
        200,
        {"message": "Test successful"}
    )

    assert result["statusCode"] == 200
    assert json.loads(result["body"]) == {
        "message": "Test successful"
    }
