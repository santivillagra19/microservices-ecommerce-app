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

## 🛠️ Cómo ejecutar el proyecto (Local con Kubernetes)

El proyecto está diseñado con un enfoque Cloud Native. La forma recomendada de desplegarlo localmente para pruebas es utilizando **Minikube**.

### Prerrequisitos
- **Docker Desktop** (o motor de Docker equivalente)
- **Minikube** y **kubectl** instalados
- **Java 21** y **Maven**

### Paso a paso

**1. Iniciar Minikube**
Levanta tu cluster local de Kubernetes (recomendado usar el driver de Docker):
``bash
minikube start --driver=docker
``

**2. Compilar los microservicios y sus imágenes Docker**
En la raíz del proyecto, debes compilar el código de cada servicio y construir la imagen Docker apuntando directamente al demonio de Minikube:
``bash
# Compilar los artefactos (.jar) saltando los tests para mayor rapidez
mvn clean package -DskipTests -f api-gateway/pom.xml
mvn clean package -DskipTests -f product-service/pom.xml
mvn clean package -DskipTests -f order-service/pom.xml
mvn clean package -DskipTests -f inventory-service/pom.xml
mvn clean package -DskipTests -f payment-service/pom.xml
mvn clean package -DskipTests -f notification-service/pom.xml

# Construir las imágenes Docker dentro del entorno de Minikube
minikube image build -t api-gateway:latest ./api-gateway
minikube image build -t product-service:latest ./product-service
minikube image build -t order-service:latest ./order-service
minikube image build -t inventory-service:latest ./inventory-service
minikube image build -t payment-service:latest ./payment-service
minikube image build -t notification-service:latest ./notification-service
``

**3. Configurar variables y secretos**
Revisa el archivo K8s/secrets-template.yaml. Ahí se configuran las contraseñas de las bases de datos y credenciales.
*Nota importante:* Asegúrate de colocar tu **Access Token de MercadoPago** (mercadopago-access-token) con credenciales válidas de prueba si deseas probar el flujo completo de pagos.

**4. Desplegar todo en Kubernetes**
Crea el ConfigMap inicial de Keycloak y luego aplica todos los manifiestos:
``bash
# 4.1 Cargar el realm preconfigurado de Keycloak
kubectl create configmap keycloak-realm-config --from-file=ecommerce-realm.json

# 4.2 Desplegar toda la infraestructura y microservicios
kubectl apply -f K8s/
``
*(Nota: Es perfectamente normal que algunos microservicios se reinicien ("CrashLoopBackOff") durante los primeros minutos mientras las bases de datos y Keycloak terminan de inicializarse. Los mecanismos de tolerancia a fallos los reconectarán automáticamente).*

**5. Exponer los servicios (Port-Forward)**
Para poder acceder a la API (Gateway) y al panel de Keycloak desde tu navegador o desde el Frontend, debes mantener expuestos estos dos puertos en terminales separadas:
``bash
# Terminal 1: Expone el Gateway (punto de entrada principal)
kubectl port-forward service/gateway-service 9000:9000

# Terminal 2: Expone Keycloak (para que el frontend pueda autenticar)
kubectl port-forward service/keycloak 8080:8080
``

¡Listo! La API estará completamente operativa en http://localhost:9000.
