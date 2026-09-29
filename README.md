# 🛠️ Ferrestore - Plataforma E-Commerce

¡Bienvenido al repositorio principal de **Ferrestore**! Una solución de comercio electrónico completa especializada en herramientas, construida sobre una arquitectura moderna, escalable y nativa de la nube (Cloud Native).

## 📂 Estructura del Proyecto

Este monorepositorio contiene todo el ecosistema de Ferrestore, dividido en dos grandes bloques funcionales:

### 1. [Backend: Arquitectura de Microservicios](./microservices-ecommerce/README.md)
Ubicado en la carpeta `microservices-ecommerce`. Es el motor de la plataforma, desarrollado con **Java 21 y Spring Boot**. Utiliza un enfoque orientado a eventos con **RabbitMQ**, hilos virtuales con **Project Loom**, y está orquestado nativamente en **Kubernetes**. Gestiona los datos a través de bases de datos políglotas (**MongoDB, PostgreSQL, MySQL**) y asegura la plataforma con **Keycloak**.

**👉 [Ver Documentación del Backend](./microservices-ecommerce/README.md)**

### 2. [Frontend: Aplicación Cliente](./frontend-ecommerce/README.md)
Ubicado en la carpeta `frontend-ecommerce`. Es la interfaz visual construida con **React y TypeScript**. Se conecta de forma segura con los microservicios para ofrecer una experiencia de usuario fluida, desde la visualización del catálogo hasta el flujo asíncrono de compra y la pasarela de pagos de **MercadoPago**.

**👉 [Ver Documentación del Frontend](./frontend-ecommerce/README.md)**

## 🚀 Cómo empezar
Para levantar el proyecto localmente o explorar el código a detalle, por favor dirígete a la carpeta del entorno en el que deseas trabajar y consulta su respectiva guía.

---
*Construido aplicando las mejores prácticas de Arquitectura de Software, Microservicios y Frontend Reactivo.*
