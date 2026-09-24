import urllib.request
import json

req1 = urllib.request.Request('http://localhost:9000/v3/api-docs/swagger-config')
try:
    resp1 = urllib.request.urlopen(req1)
    config = json.loads(resp1.read().decode())
    print("Config loaded successfully:")
    print(config['urls'])
    for u in config['urls']:
        url = 'http://localhost:9000' + u['url']
        try:
            req2 = urllib.request.Request(url)
            resp2 = urllib.request.urlopen(req2)
            print(f"Successfully fetched {url}, status: {resp2.status}")
        except Exception as e:
            print(f"Failed to fetch {url}: {e}")
except Exception as e:
    print(f"Failed to load config: {e}")
