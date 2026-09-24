import json
import urllib.request

products_file = "C:/Users/santi/Documents/UdemySpring/microservices-ecommerce/product-service/src/main/resources/products.json"
with open(products_file, 'r', encoding='utf-8') as f:
    products = json.load(f)

for p in products:
    url = p['imageUrl']
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        res = urllib.request.urlopen(req)
        print(f"OK: {url}")
    except Exception as e:
        print(f"FAILED: {url} - {e}")
