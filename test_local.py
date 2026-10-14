
from hello_world.app import lambda_handler
import json

def test(method, path, body=None):
    event = {
        "requestContext": {"http": {"method": method}},
        "rawPath": path,
        "body": json.dumps(body) if body else None
    }

    result = lambda_handler(event, None)
    print(method, path, "=>", result["statusCode"])
    print(json.loads(result["body"]))

test("GET", "/", None)
test("GET", "/notes", None)
test("POST", "/notes", {"title": "My first note"})
test("DELETE", "/notes/1", None)
test("GET", "/notes", None)
