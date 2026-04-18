import urllib.request
import json
import re

url = "https://uiverse.io/api/elements?tags=neumorphism&page=1"
req = urllib.request.Request(
    url, 
    headers={'User-Agent': 'Mozilla/5.0'}
)

try:
    response = urllib.request.urlopen(req)
    data = json.loads(response.read().decode('utf-8'))
    for element in data.get('elements', []):
        author = element.get('user', {}).get('username', 'unknown')
        title = element.get('title', 'untitled')
        html = element.get('html', '')
        css = element.get('css', '')
        if author == 'marcelodolza' or author == 'csemszepp' or author == 'Praashoo7':
            print(f"--- {title} by {author} ---")
            print("HTML:")
            print(html)
            print("CSS:")
            print(css)
            print()
except Exception as e:
    print(f"Error: {e}")

