# Contexto del Proyecto Backend (Microservices Ecommerce)

Este documento describe la arquitectura, servicios, tecnolog\u00edas y endpoints del backend, para servir como referencia y documentaci\u00f3n principal (por ejemplo, para construir el frontend).

## 1. Arquitectura General y Tecnolog\u00edas Core

El sistema est\u00e1 basado en una arquitectura de microservicios desarrollada con **Spring Boot** y **Spring Cloud**.

*   **API Gateway:** Gestiona y enruta todas las peticiones externas. Corre en el puerto `9000`.
*   **Service Discovery (Eureka):** Registra y descubre los microservicios (`discovery-server`).
*   **Config Server:** Centraliza la configuraci\u00f3n de los servicios (`config-server`).
*   **Seguridad (Keycloak):** Servidor de Identidad y Acceso (IAM) corriendo en el puerto `8080`.
*   **Message Broker:** RabbitMQ para la comunicaci\u00f3n as\u00edncrona entre microservicios (por ejemplo, notificaciones).

## 2. Microservicios y Bases de Datos

Cada microservicio gestiona su propia base de datos, siguiendo el patr\u00f3n "Database per Service".

### A. Product Service
*   **Puerto interno:** (Din\u00e1mico / Resuelto v\u00eda Gateway)
*   **Base de Datos:** MongoDB (`product-db`) en puerto `27017`
*   **Responsabilidad:** Gesti\u00f3n del cat\u00e1logo de productos.

### B. Order Service
*   **Puerto interno:** (Din\u00e1mico / Resuelto v\u00eda Gateway)
*   **Base de Datos:** PostgreSQL 16 (`order-db`) en puerto `5434`
*   **Responsabilidad:** Procesamiento de \u00f3rdenes de compra.

### C. Inventory Service
*   **Puerto interno:** (Din\u00e1mico / Resuelto v\u00eda Gateway)
*   **Base de Datos:** MySQL 8 (`inventory-db`) en puerto `3307`
*   **Responsabilidad:** Gesti\u00f3n de stock y disponibilidad de los productos.

### D. Notification Service
*   **Responsabilidad:** Escucha eventos de RabbitMQ para enviar notificaciones (ej. confirmaci\u00f3n de \u00f3rdenes). No expone endpoints REST p\u00fablicos.

---

## 3. Endpoints P\u00fablicos (Accesibles v\u00eda API Gateway)

Todas las peticiones desde el frontend o clientes externos deben dirigirse a `http://localhost:9000`. El Gateway requiere un token JWT v\u00e1lido provisto por Keycloak.

### Endpoints de Productos
Ruta base en Gateway: `/api/v1/product`
*   `GET /api/v1/product` - Lista todos los productos.
*   `GET /api/v1/product/{id}` - Detalles de un producto.
*   `POST /api/v1/product` - Crea un producto (Requiere admin/permisos).
*   `PUT /api/v1/product/{id}` - Actualiza un producto.
*   `DELETE /api/v1/product/{id}` - Elimina un producto.

### Endpoints de \u00d3rdenes (Checkout)
Ruta base en Gateway: `/api/v1/order`
*   `POST /api/v1/order` - Crea una nueva orden de compra.
*   `GET /api/v1/order` - Lista las \u00f3rdenes del usuario.
*   `GET /api/v1/order/{id}` - Detalles de una orden.
*   `DELETE /api/v1/order/{id}` - Cancela una orden.

### Endpoints de Inventario
Ruta base en Gateway: `/api/v1/inventory`
*   `GET /api/v1/inventory` - Lista el estado del inventario completo.
*   `GET /api/v1/inventory/{sku}` - Verifica la disponibilidad/stock de un producto espec\u00edfico por su c\u00f3digo SKU.
*   `POST /api/v1/inventory` - A\u00f1ade un nuevo SKU al inventario.
*   `PUT /api/v1/inventory/{id}` - Actualiza informaci\u00f3n de inventario.
*   `PUT /api/v1/inventory/reduce/{sku}` - Disminuye el stock (usado durante la creaci\u00f3n de la orden).
*   `DELETE /api/v1/inventory/{id}` - Elimina un registro.

---

## 4. Flujo de Autenticaci\u00f3n y Seguridad (Recomendaciones)

1.  **Keycloak (Realm: ecommerce-realm):**
    *   El API Gateway act\u00faa como cliente (`api-gateway-client`) y est\u00e1 configurado con `TokenRelay`.
    *   **Para el Frontend:** Se recomienda usar el flujo `Authorization Code` con PKCE. Puedes utilizar librer\u00edas como `react-oidc-context` o `keycloak-js`. Al autenticarse, Keycloak devolver\u00e1 un token JWT.
2.  **Llamadas a la API:**
    *   Todas las llamadas http desde el cliente (ej. usando Axios o Fetch) hacia `http://localhost:9000` deben incluir la cabecera: `Authorization: Bearer <tu_token_jwt>`.

## 5. Recomendaciones Arquitect\u00f3nicas para Clientes

*   **Composici\u00f3n de Datos (BFF):** Como es una arquitectura de microservicios pura, el Gateway actual hace ruteo directo. Para mostrar una p\u00e1gina de producto compleja, el cliente tendr\u00e1 que hacer m\u00faltiples llamadas (una a `/product` por los detalles, otra a `/inventory/{sku}` por el stock).
*   **Manejo de Errores:** Considerar qu\u00e9 pasa en la UI si el servicio de inventario est\u00e1 ca\u00eddo pero el de productos funciona. Mostrar el cat\u00e1logo indicando "Stock no disponible moment\u00e1neamente" es una buena pr\u00e1ctica de resiliencia.
*   **Cach\u00e9 en Frontend:** Se recomienda fuertemente usar herramientas como TanStack Query (React Query) en el frontend para evitar saturar el API Gateway con peticiones repetitivas al cat\u00e1logo.
