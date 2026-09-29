# ðŸ› ï¸ Ferrestore E-Commerce - Arquitectura de Microservicios

Â¡Bienvenido al core de **Ferrestore**! ðŸš€ Este proyecto es el motor de una plataforma de comercio electrÃ³nico especializada en herramientas (desde uso domÃ©stico hasta industrial). EstÃ¡ diseÃ±ado bajo una **Arquitectura de Microservicios** robusta, escalable y orientada a eventos, preparada para soportar alta concurrencia y despliegues en la nube.

## ðŸŒŸ Objetivo del Proyecto
El objetivo es demostrar una arquitectura empresarial moderna. Ferrestore no es solo un e-commerce; es un ecosistema donde cada dominio de negocio (Productos, Ã“rdenes, Inventario) vive de forma independiente, comunicÃ¡ndose de manera resiliente y asÃ­ncrona para garantizar que ninguna compra se pierda, incluso ante caÃ­das de servicios.

## ðŸš€ TecnologÃ­as Destacadas
Este backend estÃ¡ construido sobre la vanguardia del ecosistema Java y Cloud Native:

* **Core:** Java 21 & Spring Boot
* **Concurrencia:** Project Loom (Hilos Virtuales) para un rendimiento asÃ­ncrono superior.
* **OrquestaciÃ³n y Contenedores:** Docker & Kubernetes.
* **ComunicaciÃ³n AsÃ­ncrona (Event-Driven):** RabbitMQ (PatrÃ³n Saga para consistencia distribuida).
* **Bases de Datos PolÃ­glotas:** 
  * MongoDB (CatÃ¡logo de Productos)
  * PostgreSQL (GestiÃ³n de Ã“rdenes)
  * MySQL (Control de Inventario)
* **Seguridad y AutenticaciÃ³n:** Keycloak (IAM) + JWT.
* **Tolerancia a Fallos:** Resilience4j (Circuit Breaker, Retry, Timeouts).
* **Pagos:** IntegraciÃ³n con la API de MercadoPago.

## ðŸ“ Estructura del Repositorio

El proyecto se divide en mÃ³dulos independientes, cada uno responsable de un contexto especÃ­fico (Domain-Driven Design):

```text
microservices-ecommerce/
â”œâ”€â”€ ðŸ—‚ï¸ api-gateway/            # Puerta de entrada, enrutamiento y validaciÃ³n JWT.
â”œâ”€â”€ ðŸ—‚ï¸ product-service/        # GestiÃ³n del catÃ¡logo (MongoDB).
â”œâ”€â”€ ðŸ—‚ï¸ order-service/          # GestiÃ³n de compras y pagos con MercadoPago (PostgreSQL).
â”œâ”€â”€ ðŸ—‚ï¸ inventory-service/      # Control de stock y reservas (MySQL).
â”œâ”€â”€ ðŸ—‚ï¸ notification-service/   # Escucha eventos (RabbitMQ) para envÃ­os de emails/alertas.
â”œâ”€â”€ ðŸ—‚ï¸ k8s/                    # Manifiestos de Kubernetes (Deployments, Services, ConfigMaps).
â”œâ”€â”€ ðŸ“„ docker-compose.yml      # Entorno local de desarrollo (BBDD, RabbitMQ, Keycloak).
â””â”€â”€ ðŸ“„ context.md              # DocumentaciÃ³n detallada de la API y endpoints.
```

## âš™ï¸ Patrones de DiseÃ±o Aplicados
* **API Gateway Pattern:** Punto Ãºnico de acceso para clientes.
* **Saga Pattern (Choreography):** Manejo de transacciones distribuidas (ej. Orden Creada -> Reservar Stock -> Pago -> Confirmar/Cancelar Orden).
* **Circuit Breaker:** PrevenciÃ³n de fallos en cascada entre microservicios mediante Resilience4j.
* **Database per Service:** Aislamiento de datos segÃºn el microservicio.

## 🔐 Credenciales de Prueba
Para evaluar el proyecto y acceder a las funcionalidades de administrador (como crear productos o gestionar órdenes), puedes utilizar el siguiente usuario preconfigurado en Keycloak:
- **Email:** `admin@ferrestore.com`
- **Contraseña:** `admin123`

> ⚠️ **Nota:** Estas credenciales son exclusivamente para entornos de desarrollo y pruebas. En un entorno de producción, asegúrate de cambiar la contraseña y gestionar los usuarios de forma segura.




## 🚀 Próximos pasos
- Tests unitarios con JUnit 5 y Mockito (lógica de la Saga, transiciones de estado de pedidos, webhook de Mercado Pago).
- Tests de integración con Spring Boot Test y Testcontainers (Outbox, RabbitMQ, bases de datos).
- Integración continua con GitHub Actions.
