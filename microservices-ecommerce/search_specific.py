import urllib.request, re

def search_commons(query):
    url = 'https://commons.wikimedia.org/w/index.php?search=' + urllib.parse.quote(query) + '&title=Special:MediaSearch&go=Go&type=image'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    html = urllib.request.urlopen(req).read().decode('utf-8')
    # Use a simpler regex for src="..."
    urls = re.findall(r'src="(https://upload.wikimedia.org/wikipedia/commons/thumb/[^"]+\.(?:jpg|jpeg|png)/\d+px-[^"]+\.(?:jpg|jpeg|png))"', html, re.IGNORECASE)
    # Deduplicate and keep order
    seen = set()
    res = []
    for u in urls:
        if u not in seen:
            seen.add(u)
            res.append(u)
    return res[:3]

print("1. Taladro:", search_commons("DeWalt cordless drill"))
print("2. Martillo:", search_commons("claw hammer tool"))
print("3. Destornillador inalambrico:", search_commons("Bosch IXO cordless screwdriver"))
print("4. Nivel laser:", search_commons("laser level tool -green"))
print("5. Sierra caladora:", search_commons("jigsaw tool power -homemade -DIY"))
print("6. Soldadora:", search_commons("inverter welding machine front"))
print("7. Guantes:", search_commons("leather work gloves safety"))
print("8. Cuter:", search_commons("stanley utility knife heavy duty"))
