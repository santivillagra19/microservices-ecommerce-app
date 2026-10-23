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

## 📦 Estructura del Repositorio

El proyecto se divide en módulos independientes, cada uno responsable de un contexto específico (Domain-Driven Design):

```text
microservices-ecommerce/
├── api-gateway/          # Puerta de entrada, enrutamiento y validación JWT
├── config-server/        # Servidor centralizado de configuración (Spring Cloud Config)
├── config-data/          # Archivos de configuración (.yml) para el config-server
├── discovery-server/     # Servidor de registro y descubrimiento (Eureka)
├── inventory-service/    # Control de stock y reservas (MySQL)
├── notification-service/ # Escucha eventos (RabbitMQ) para envíos de emails/alertas
├── order-service/        # Gestión de compras (PostgreSQL)
├── payment-service/      # Integración de pagos con MercadoPago
├── product-service/      # Gestión del catálogo de productos (MongoDB)
├── tests/                # Pruebas End-to-End (e2e) del sistema completo
├── K8s/                  # Manifiestos de Kubernetes (Deployments, Services, ConfigMaps)
├── docker-compose.yml    # Entorno local de desarrollo (BBDD, RabbitMQ, Keycloak)
└── context.md            # Documentación detallada de la API y endpoints
```

## ⚙️ Patrones de Diseño Aplicados
* **API Gateway Pattern:** Punto único de acceso para clientes.
* **Saga Pattern (Choreography):** Manejo de transacciones distribuidas (ej. Orden Creada -> Reservar Stock -> Pago -> Confirmar/Cancelar Orden).
* **Circuit Breaker:** Prevención de fallos en cascada entre microservicios mediante Resilience4j.
* **Database per Service:** Aislamiento de datos según el microservicio.

## 🔐 Credenciales de Prueba
Para evaluar el proyecto y acceder a las funcionalidades de administrador (como crear productos o gestionar órdenes), puedes utilizar el siguiente usuario preconfigurado en Keycloak:
- **Email:** admin@ferrestore.com
- **Contraseña:** admin123

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
```bash
minikube start --driver=docker
```

**2. Verificar y construir con Java 21**
El POM padre centraliza las versiones de los ocho módulos. Usar un JDK 21 parcheado (21.0.13 o posterior dentro de Java 21):
```powershell
$env:JAVA_HOME = "$env:LOCALAPPDATA\Programs\Java\jdk-21.0.13"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
powershell -ExecutionPolicy Bypass -File scripts/verify.ps1 -JavaHome "$env:JAVA_HOME"
powershell -ExecutionPolicy Bypass -File scripts/scan.ps1
powershell -ExecutionPolicy Bypass -File scripts/build-images.ps1
powershell -ExecutionPolicy Bypass -File scripts/scan.ps1 -Images
```
Todos los builds Docker usan el Dockerfile y el contexto raíz. Las etiquetas de esta actualización son `security-20261023`. Ver [la guía de seguridad](security/README.md) para informes, versiones y migración de Keycloak.

**3. Configurar variables y secretos**
Usar `K8s/templates/secrets-template.yaml` solo como referencia para crear secretos reales. Las plantillas están en una subcarpeta para impedir que `kubectl apply -f K8s/` sobrescriba credenciales existentes con valores de ejemplo.
*Nota importante:* Asegúrate de colocar tu **Access Token de MercadoPago** (`mercadopago-secret/access-token`) con credenciales válidas de prueba si deseas probar el flujo completo de pagos.

Para recibir confirmaciones, configurar `MERCADOPAGO_WEBHOOK_URL` con la URL HTTPS pública
de `/api/v1/webhook/mercadopago` y agregar `webhook-secret` a `mercadopago-secret`.
La clave de firma se obtiene en Webhooks de la aplicación de Mercado Pago y es distinta
del Access Token. Sin esa clave, el endpoint devuelve 503; las firmas inválidas reciben 401.
Solo se admiten Webhooks firmados con `data.id`, no notificaciones IPN sin firma.
El correo necesita credenciales SMTP válidas en `email-secret`; el despliegue exige STARTTLS
y verifica la identidad del servidor. HTTPS por sí solo no configura el envío de correos.

**4. Desplegar en Kubernetes**
En una instalación existente, migrar Keycloak siguiendo `security/README.md` (respaldo y ensayo en una base clonada). Los servicios verificados se actualizan con `powershell -ExecutionPolicy Bypass -File scripts/deploy-services.ps1`. No aplicar plantillas de secretos sobre una instalación existente.

Para una instalación nueva:
Crea el ConfigMap inicial de Keycloak y luego aplica todos los manifiestos:
```bash
# 4.1 Cargar el realm preconfigurado de Keycloak
kubectl create configmap keycloak-realm-config --from-file=ecommerce-realm.json

minikube image load ferrestore-keycloak:26.8.1-java21.0.13

# 4.2 Desplegar toda la infraestructura y microservicios
kubectl apply -f K8s/
```
Luego cargar las seis imágenes verificadas con `powershell -ExecutionPolicy Bypass -File scripts/deploy-services.ps1`.
*(Nota: Es perfectamente normal que algunos microservicios se reinicien ("CrashLoopBackOff") durante los primeros minutos mientras las bases de datos y Keycloak terminan de inicializarse. Los mecanismos de tolerancia a fallos los reconectarán automáticamente).*

**5. Exponer los servicios (Port-Forward)**
Para poder acceder a la API (Gateway) y al panel de Keycloak desde tu navegador o desde el Frontend, debes mantener expuestos estos dos puertos en terminales separadas:
```bash
# Terminal 1: Expone el Gateway (punto de entrada principal)
kubectl port-forward service/gateway-service 9000:9000

# Terminal 2: Expone Keycloak (para que el frontend pueda autenticar)
kubectl port-forward service/keycloak 8080:8080
```

¡Listo! La API estará completamente operativa en `http://localhost:9000`.

