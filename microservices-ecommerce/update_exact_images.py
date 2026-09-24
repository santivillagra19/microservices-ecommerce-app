import json
import hashlib
import urllib.parse

def get_commons_url(filename):
    filename = filename.replace(' ', '_')
    # Calculate MD5 hash of the filename
    md5 = hashlib.md5(filename.encode('utf-8')).hexdigest()
    # URL structure: https://upload.wikimedia.org/wikipedia/commons/a/ab/Filename.jpg
    return f"https://upload.wikimedia.org/wikipedia/commons/{md5[0]}/{md5[0:2]}/{urllib.parse.quote(filename)}"

# Real specific filenames from Wikimedia Commons
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
    if i < len(filenames):
        products[i]['imageUrl'] = get_commons_url(filenames[i])

with open(products_file, 'w', encoding='utf-8') as f:
    json.dump(products, f, indent=2, ensure_ascii=False)

print("Updated products.json with specific high-quality Wikimedia images!")
