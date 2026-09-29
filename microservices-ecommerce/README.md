# 🛠️ Ferrestore E-Commerce - Arquitectura de Microservicios

¡Bienvenido al core de **Ferrestore**! 🚀 Este proyecto es el motor de una plataforma de comercio electrónico especializada en herramientas (desde uso doméstico hasta industrial). Está diseñado bajo una **Arquitectura de Microservicios** robusta, escalable y orientada a eventos, preparada para soportar alta concurrencia y despliegues en la nube.

## 🌟 Objetivo del Proyecto
El objetivo es demostrar una arquitectura empresarial moderna. Ferrestore no es solo un e-commerce; es un ecosistema donde cada dominio de negocio (Productos, Órdenes, Inventario) vive de forma independiente, comunicándose de manera resiliente y asíncrona para garantizar que ninguna compra se pierda, incluso ante caídas de servicios.

## 🚀 Tecnologías Destacadas
Este backend está construido sobre la vanguardia del ecosistema Java y Cloud Native:

* **Core:** Java 21 & Spring Boot
* **Concurrencia:** Project Loom (Hilos Virtuales) para un rendimiento asíncrono superior.
* **Orquestación y Contenedores:** Docker & Kubernetes.
* **Comunicación Asíncrona (Event-Driven):** RabbitMQ (Patrón Saga para consistencia distribuida).
* **Bases de Datos Políglotas:** 
  * MongoDB (Catálogo de Productos)
  * PostgreSQL (Gestión de Órdenes)
  * MySQL (Control de Inventario)
* **Seguridad y Autenticación:** Keycloak (IAM) + JWT.
* **Tolerancia a Fallos:** Resilience4j (Circuit Breaker, Retry, Timeouts).
* **Pagos:** Integración con la API de MercadoPago.

## 📁 Estructura del Repositorio

El proyecto se divide en módulos independientes, cada uno responsable de un contexto específico (Domain-Driven Design):

```text
microservices-ecommerce/
├── 🗂️ api-gateway/            # Puerta de entrada, enrutamiento y validación JWT.
├── 🗂️ product-service/        # Gestión del catálogo (MongoDB).
├── 🗂️ order-service/          # Gestión de compras y pagos con MercadoPago (PostgreSQL).
├── 🗂️ inventory-service/      # Control de stock y reservas (MySQL).
├── 🗂️ notification-service/   # Escucha eventos (RabbitMQ) para envíos de emails/alertas.
├── 🗂️ k8s/                    # Manifiestos de Kubernetes (Deployments, Services, ConfigMaps).
├── 📄 docker-compose.yml      # Entorno local de desarrollo (BBDD, RabbitMQ, Keycloak).
└── 📄 context.md              # Documentación detallada de la API y endpoints.
```

## ⚙️ Patrones de Diseño Aplicados
* **API Gateway Pattern:** Punto único de acceso para clientes.
* **Saga Pattern (Choreography):** Manejo de transacciones distribuidas (ej. Orden Creada -> Reservar Stock -> Pago -> Confirmar/Cancelar Orden).
* **Circuit Breaker:** Prevención de fallos en cascada entre microservicios mediante Resilience4j.
* **Database per Service:** Aislamiento de datos según el microservicio.
