import fs from 'fs';
import path from 'path';

const GATEWAY_URL = 'http://localhost:9000/api/v1';
const KEYCLOAK_URL = 'http://localhost:8080/realms/ecommerce-realm/protocol/openid-connect/token';

async function seed() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error("Por favor ingresa tu usuario y contraseña de Keycloak (con rol ADMIN).");
    console.error("Uso: node seed.js <USUARIO> <CONTRASEÑA>");
    process.exit(1);
  }

  const [username, password] = args;

  console.log('1. Autenticando con Keycloak...');
  const params = new URLSearchParams();
  params.append('grant_type', 'password');
  params.append('client_id', 'admin-cli');
  params.append('username', username);
  params.append('password', password);

  let token = '';
  try {
    const authRes = await fetch(KEYCLOAK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });
    
    if (!authRes.ok) {
      throw new Error(`Error auth: ${authRes.statusText}`);
    }
    const authData = await authRes.json();
    token = authData.access_token;
    console.log(`✅ Token obtenido correctamente (Length: ${token.length})`);
    
    // Parse JWT to check roles (for debugging)
    try {
      const payloadBase64 = token.split('.')[1];
      const decodedPayload = JSON.parse(atob(payloadBase64));
      console.log('🔍 Roles detectados en el Token:', decodedPayload.realm_access?.roles || 'Ninguno');
    } catch (e) {
      console.log('⚠️ No se pudo decodificar el token para debug');
    }

    console.log('');
  } catch (error) {
    console.error('❌ Falló la autenticación. Revisa credenciales o si el usuario tiene rol ADMIN.', error.message);
    return;
  }

  console.log('2. Obteniendo productos de FakeStoreAPI...');
  let externalProducts = [];
  try {
    const fakeRes = await fetch('https://fakestoreapi.com/products?limit=10');
    externalProducts = await fakeRes.json();
    console.log(`✅ ${externalProducts.length} productos obtenidos.\n`);
  } catch (error) {
    console.error('❌ Error obteniendo la API pública.', error);
    return;
  }

  console.log('3. Guardando productos en tu base de datos y añadiendo inventario...');
  for (let i = 0; i < externalProducts.length; i++) {
    const item = externalProducts[i];
    const skuCode = `SKU-${item.id}-${Math.floor(Math.random() * 1000)}`;
    
    const newProduct = {
      name: item.title,
      description: item.description,
      price: item.price
    };

    try {
      // 1. Crear producto (Requiere ADMIN)
      const res = await fetch(`${GATEWAY_URL}/product`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newProduct)
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`⚠️ Error al crear producto ${newProduct.name}: ${res.status} - ${errorText}`);
        continue;
      }
      
      const createdProduct = await res.json();
      const actualSku = createdProduct.id;
      console.log(`✅ Producto creado: ${newProduct.name} (SKU/ID: ${actualSku})`);

      // 2. Crear inventario (Requiere ADMIN)
      const invRes = await fetch(`${GATEWAY_URL}/inventory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sku: actualSku,
          quantity: Math.floor(Math.random() * 50) + 10 // Entre 10 y 60 unidades
        })
      });

      if (invRes.ok) {
        console.log(`   📦 Inventario añadido para ${actualSku}`);
      } else {
        const invError = await invRes.text();
        console.error(`   ⚠️ Error de inventario para ${actualSku}: ${invRes.status} - ${invError}`);
      }

    } catch (error) {
      console.error(`❌ Error de red al procesar ${newProduct.name}`, error.message);
    }
  }

  console.log('\n🎉 ¡Proceso de Seed finalizado! Recarga tu frontend para ver los productos.');
}

seed();
