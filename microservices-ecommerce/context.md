# Contexto del Proyecto Backend (Microservices Ecommerce - Kubernetes)

Este documento describe la arquitectura, servicios, tecnolog\u00edas y endpoints del backend, actualizado para su despliegue en un cl\u00faster de **Kubernetes (Minikube)**.
Est\u00e1 dise\u00f1ado para ser la referencia absoluta al momento de desarrollar el **Frontend**.

## 1. Arquitectura General y Tecnolog\u00edas Core

El sistema est\u00e1 basado en una arquitectura de microservicios desarrollada con **Spring Boot** y orquestada nativamente en **Kubernetes**.

*   **API Gateway:** Gestiona y enruta todas las peticiones externas. Est\u00e1 expuesto fuera del cl\u00faster mediante un NodePort en el puerto `30000`. (**URL base para el Frontend:** `http://<MINIKUBE_IP>:30000`).
*   **Service Discovery & Config:** Para el despliegue en Kubernetes, ya **no** se utilizan Eureka Server ni Spring Cloud Config Server (aunque el código fuente aún los conserva para desarrollo local alternativo). El descubrimiento de servicios se delega completamente a los **Services de Kubernetes** (DNS interno `ClusterIP`) y la configuración se inyecta por variables de entorno en los *deployments*.
*   **Seguridad (Keycloak):** Servidor de Identidad y Acceso (IAM). Expuesto localmente en el puerto `8080` (`http://localhost:8080`).
*   **Message Broker:** RabbitMQ para la comunicaci\u00f3n as\u00edncrona entre microservicios (K8s Service: `rabbitmq`).

---

## 2. Modelos de Datos (DTOs) y Endpoints P\u00fablicos

Todas las peticiones HTTP desde el frontend deben dirigirse al API Gateway (`http://<MINIKUBE_IP>:30000`) e incluir el token JWT en la cabecera `Authorization: Bearer <token>`.

### A. Productos (`/api/v1/product`)

Maneja el cat\u00e1logo de productos (MongoDB).

*   **`GET /api/v1/product`** - Lista todos los productos.
    *   **Respuesta Exitosa (200 OK):** `Array` de `ProductResponseDTO`
    ```json
    [
      {
        "id": "64c8...",
        "name": "Smartphone XYZ",
        "description": "Pantalla OLED 6.5 pulgadas",
        "price": 599.99,
        "imageUrl": "https://images.unsplash.com/photo-..."
      }
    ]
    ```

*   **`POST /api/v1/product`** - Crea un nuevo producto.
    *   **Cuerpo de la petición (`ProductRequestDTO`):**
    ```json
    {
      "name": "Notebook Pro",
      "description": "16GB RAM, 512GB SSD",
      "price": 1200.50,
      "imageUrl": "https://images.unsplash.com/photo-..."
    }
    ```

*   **`GET /api/v1/product/{id}`** - Obtiene un producto por su ID.
*   **`PUT /api/v1/product/{id}`** - Actualiza un producto existente.
    *   **Cuerpo de la petición (`ProductRequestDTO`):**
    ```json
    {
      "name": "Notebook Pro Max",
      "description": "32GB RAM, 1TB SSD",
      "price": 1500.50,
      "imageUrl": "https://images.unsplash.com/photo-..."
    }
    ```
*   **`DELETE /api/v1/product/{id}`** - Elimina un producto.


### B. \u00d3rdenes / Checkout (`/api/v1/order`)

Procesa la compra. Utiliza una arquitectura asíncrona basada en eventos (Saga) a través de RabbitMQ. Al recibir la petición, la orden se guarda con estado `PLACED` y se emite un evento para que el servicio de Inventario valide el stock.

*   **`POST /api/v1/order`** - Crea una nueva orden de compra.
    *   **Cuerpo de la petición (`OrderRequestDTO`):**
    ```json
    {
      "email": "cliente@example.com",
      "orderLineItemsList": [
        {
          "sku": "NOTEBOOK-PRO-01",
          "price": 1200.50,
          "quantity": 1
        }
      ]
    }
    ```
    *   **Respuesta Exitosa (201 Created):** El objeto orden con el estado inicial `PLACED`.
    *   **Importante para Frontend:** Como el procesamiento es asíncrono, la orden se crea de inmediato con éxito. Si no hay stock, el estado de la orden cambiará asíncronamente a `CANCELLED` en la base de datos (o `CONFIRMED` si hay éxito). El frontend debe consultar periódicamente el estado de la orden (mediante `GET /api/v1/order/{id}`) o depender de las notificaciones que el sistema envíe al usuario.

*   **`GET /api/v1/order`** - Lista las órdenes.
    *   **Respuesta Exitosa (200 OK):** `Array` de `OrderResponseDTO`
    ```json
    [
      {
        "id": 1,
        "orderNumber": "ORD-55b4-4a...",
        "orderStatus": "PLACED",
        "orderLineItemsList": [
          {
            "id": 1,
            "sku": "NOTEBOOK-PRO-01",
            "price": 1200.50,
            "quantity": 1
          }
        ]
      }
    ]
    ```

*   **`GET /api/v1/order/{id}`** - Obtiene una orden por su ID.
*   **`DELETE /api/v1/order/{id}`** - Elimina una orden.

### C. Inventario (`/api/v1/inventory`)

Maneja el stock disponible de los productos (MySQL).

*   **`GET /api/v1/inventory`** - Lista el estado del inventario completo.
    *   **Respuesta Exitosa (200 OK):** `Array` de `InventoryResponseDTO`
    ```json
    [
      {
        "id": 1,
        "sku": "NOTEBOOK-PRO-01",
        "quantity": 50,
        "inStock": true
      }
    ]
    ```

*   **`POST /api/v1/inventory`** - Añade stock para un SKU.
    *   **Cuerpo de la petición (`InventoryRequestDTO`):**
    ```json
    {
      "sku": "NOTEBOOK-PRO-01",
      "quantity": 50
    }
    ```

*   **`GET /api/v1/inventory/{sku}`** - Verifica si hay stock de un producto (opcional `quantity` en query param, por defecto 1). Retorna boolean.
*   **`PUT /api/v1/inventory/{id}`** - Actualiza el inventario de un registro.
*   **`PUT /api/v1/inventory/reduce/{sku}?quantity=x`** - Reduce el stock de un SKU específico.
*   **`DELETE /api/v1/inventory/{id}`** - Elimina un registro de inventario.

---

## 3. Gu\u00eda de Integraci\u00f3n para el Frontend

### Obtenci\u00f3n de IP y CORS
1.  **IP Base:** Pide al usuario backend ejecutar `minikube ip` para saber a qu\u00e9 IP hacer las peticiones (ej. `192.168.49.2`).
2.  **CORS:** Si usas React/Next.js en local (`localhost:3000`), es probable que enfrentes errores de CORS al llamar al API Gateway. Si es as\u00ed, deber\u00e1s agregar la configuraci\u00f3n de CORS Global en el archivo `application-k8s.yml` del `api-gateway` para permitir tu origen.

### Autenticaci\u00f3n (Keycloak)
Para integrarte en el frontend, tienes dos opciones:

**Opci\u00f3n A: Uso de librer\u00edas OIDC (Recomendado para Producci\u00f3n)**
Utiliza librer\u00edas como `react-oidc-context` o `keycloak-js`. Config\u00faralas apuntando al realm del cl\u00faster:
*   `authority` / `url`: `http://localhost:8080/realms/ecommerce-realm`
*   `client_id`: `api-gateway-client`
Esto delegará el login a la pantalla de Keycloak y manejará el ciclo de vida del token automáticamente.

**Opción B: Login Custom con Axios (Para desarrollo rápido)**
Haz un `POST` a Keycloak y guarda el token temporalmente (ej. en Zustand / LocalStorage):
```javascript
const response = await axios.post(
  'http://localhost:8080/realms/ecommerce-realm/protocol/openid-connect/token',
  new URLSearchParams({
    grant_type: 'password',
    client_id: 'api-gateway-client',
    username: '<TU_USUARIO>',
    password: '<TU_PASSWORD>'
  }),
  { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
);
const token = response.data.access_token;
```

### Interceptor de Axios
Configura un interceptor en tu cliente HTTP para inyectar autom\u00e1ticamente el Token en todas las llamadas a la API:
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://<MINIKUBE_IP>:30000/api/v1'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token'); // o tu estado global
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```
