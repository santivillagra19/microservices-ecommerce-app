import json
import urllib.request
import time
import hashlib
import requests

cloud_name = "vqmbnoju"
api_key = "926637667593316"
api_secret = "04bSiowu58wSeBplLlXj5UJNuks"

search_terms = [
    "dewalt,drill",         # 1
    "circular,saw",         # 2
    "socket,wrench",        # 3
    "claw,hammer",          # 4
    "angle,grinder",        # 5
    "tape,measure",         # 6
    "cordless,screwdriver", # 7
    "screwdriver,set",      # 8
    "lineman,pliers",       # 9
    "laser,level",          # 10
    "jigsaw,tool",          # 11
    "metal,toolbox",        # 12
    "step,ladder",          # 13
    "air,compressor",       # 14
    "combination,wrench",   # 15
    "welding,machine",      # 16
    "hard,hat",             # 17
    "leather,work,gloves",  # 18
    "orbital,sander",       # 19
    "utility,knife"         # 20
]

products_file = "C:/Users/santi/Documents/UdemySpring/microservices-ecommerce/product-service/src/main/resources/products.json"
with open(products_file, 'r', encoding='utf-8') as f:
    products = json.load(f)

for i, product in enumerate(products):
    if i >= len(search_terms): break
    
    term = search_terms[i]
    source_url = f"https://loremflickr.com/500/500/{term}/all"
    print(f"[{i}] Downloading from {source_url}...")
    
    try:
        req = urllib.request.Request(source_url, headers={'User-Agent': 'Mozilla/5.0'})
        res = urllib.request.urlopen(req)
        img_data = res.read()
    except Exception as e:
        print(f"Failed to download {source_url}: {e}")
        continue
        
    timestamp = str(int(time.time()))
    public_id = f"tool_{i}"
    
    params_to_sign = f"folder=ecommerce_products&public_id={public_id}&timestamp={timestamp}{api_secret}"
    signature = hashlib.sha1(params_to_sign.encode('utf-8')).hexdigest()
    
    url = f"https://api.cloudinary.com/v1_1/{cloud_name}/image/upload"
    data = {
        'api_key': api_key,
        'timestamp': timestamp,
        'signature': signature,
        'folder': 'ecommerce_products',
        'public_id': public_id
    }
    files = {'file': ('image.jpg', img_data)}
    
    try:
        r = requests.post(url, data=data, files=files)
        res = r.json()
        if 'secure_url' in res:
            products[i]['imageUrl'] = res['secure_url']
            print(f"Success! -> {res['secure_url']}")
        else:
            print(f"Cloudinary error: {res}")
    except Exception as e:
        print(f"Upload failed: {e}")

with open(products_file, 'w', encoding='utf-8') as f:
    json.dump(products, f, indent=2, ensure_ascii=False)
print("Finished uploading to Cloudinary and updated products.json!")
