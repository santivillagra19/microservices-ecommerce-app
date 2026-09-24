import json
import urllib.request
import time
import hashlib
import base64
import time

cloud_name = "vqmbnoju"
api_key = "926637667593316"
api_secret = "04bSiowu58wSeBplLlXj5UJNuks"

def get_commons_url(filename):
    filename = filename.replace(' ', '_')
    md5 = hashlib.md5(filename.encode('utf-8')).hexdigest()
    return f"https://upload.wikimedia.org/wikipedia/commons/{md5[0]}/{md5[0:2]}/{urllib.parse.quote(filename)}"

filenames = [
    "DeWalt 20 Volt Max Cordless Drill.jpg",     # 1. Taladro Percutor 20V
    "Circular saw.jpg",                          # 2. Sierra Circular 7-1/4"
    "Socket wrench and sockets.JPG",             # 3. Juego de Llaves de Tubo
    "Stanley graphite claw hammer.jpg",          # 4. Martillo Galponero 16oz
    "AngleGrinder.jpg",                          # 5. Amoladora Angular
    "Tape Measure 25' Klein Tools.jpg",          # 6. Cinta Métrica
    "Bosch IXO.jpg",                             # 7. Destornillador Inalámbrico
    "Screw Driver display.jpg",                  # 8. Juego de Destornilladores
    "Klein lineman's pliers.jpg",                # 9. Pinza Universal
    "Laser-Level.jpg",                           # 10. Nivel Láser
    "Jigsaw AccuMaster.jpg",                     # 11. Sierra Caladora
    "Metal toolbox.jpg",                         # 12. Caja de Herramientas
    "Step ladder.jpg",                           # 13. Escalera de Aluminio
    "AirCompressorHusky.JPG",                    # 14. Compresor de Aire
    "Combination wrench sizes 1.jpg",            # 15. Juego Llaves Combinadas
    "Welding equipment.jpg",                     # 16. Soldadora Inverter
    "Hard hat yellow.jpg",                       # 17. Casco de Seguridad
    "Leather work gloves.jpg",                   # 18. Guantes de Trabajo
    "Orbital sander.jpg",                        # 19. Lijadora Orbital
    "Aaknife2.jpg"                               # 20. Cúter Profesional
]

products_file = "C:/Users/santi/Documents/UdemySpring/microservices-ecommerce/product-service/src/main/resources/products.json"
with open(products_file, 'r', encoding='utf-8') as f:
    products = json.load(f)

for i, product in enumerate(products):
    if i >= len(filenames): break
    
    source_url = get_commons_url(filenames[i])
    print(f"[{i}] Uploading: {source_url}")
    
    # 1. Download image locally
    try:
        req = urllib.request.Request(source_url, headers={'User-Agent': 'Mozilla/5.0'})
        img_data = urllib.request.urlopen(req).read()
    except Exception as e:
        print(f"Failed to download {source_url}: {e}")
        time.sleep(2)
        continue
        
    # 2. Upload to Cloudinary using their REST API
    # Create signature
    timestamp = str(int(time.time()))
    public_id = f"tool_{i}"
    
    # params to sign
    params_to_sign = f"folder=ecommerce_products&public_id={public_id}&timestamp={timestamp}{api_secret}"
    signature = hashlib.sha1(params_to_sign.encode('utf-8')).hexdigest()
    
    import requests
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
            product['imageUrl'] = res['secure_url']
            print(f"Success! -> {res['secure_url']}")
        else:
            print(f"Cloudinary error: {res}")
    except Exception as e:
        print(f"Upload failed: {e}")
        
    time.sleep(2)

with open(products_file, 'w', encoding='utf-8') as f:
    json.dump(products, f, indent=2, ensure_ascii=False)
print("Finished uploading to Cloudinary and updated products.json!")
