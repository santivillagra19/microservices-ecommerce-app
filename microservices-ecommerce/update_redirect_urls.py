import json
import urllib.parse

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
        filename = filenames[i].replace(' ', '_')
        # Use Wikipedia Special:Redirect/file to automatically get the correct sized thumbnail without 429 errors
        url = f"https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/{urllib.parse.quote(filename)}&width=500"
        products[i]['imageUrl'] = url

with open(products_file, 'w', encoding='utf-8') as f:
    json.dump(products, f, indent=2, ensure_ascii=False)

print("Updated products.json with Wikipedia Special Redirect URLs!")
