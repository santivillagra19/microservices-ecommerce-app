import urllib.request
import json
import urllib.parse
import time

products_file = "C:/Users/santi/Documents/UdemySpring/microservices-ecommerce/product-service/src/main/resources/products.json"

with open(products_file, 'r', encoding='utf-8') as f:
    products = json.load(f)

search_terms = [
    "Hand_drill",
    "Circular_saw",
    "Socket_wrench",
    "Claw_hammer",
    "Angle_grinder",
    "Tape_measure",
    "Screwdriver",
    "Screwdriver",
    "Lineman's_pliers",
    "Laser_level",
    "Jigsaw_(tool)",
    "Toolbox",
    "Ladder",
    "Air_compressor",
    "Wrench",
    "Welding",
    "Hard_hat",
    "Glove",
    "Sander",
    "Utility_knife"
]

for i, product in enumerate(products):
    query = search_terms[i]
    url = f"https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles={urllib.parse.quote(query)}"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'AntigravityAgent/1.0 (test@example.com)'})
        response = urllib.request.urlopen(req)
        res = json.loads(response.read())
        pages = res['query']['pages']
        page = list(pages.values())[0]
        if 'original' in page:
            image_url = page['original']['source']
            products[i]['imageUrl'] = image_url
            print(f"Found for {query}: {image_url}")
        else:
            print(f"No image found for {query}")
    except Exception as e:
        print(f"Error for {query}: {e}")
    time.sleep(1.5)

with open(products_file, 'w', encoding='utf-8') as f:
    json.dump(products, f, indent=2, ensure_ascii=False)
