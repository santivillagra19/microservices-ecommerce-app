# Validación — 2026-10-23

- Java de compilación: Liberica **21.0.13+11**, con target 21.
- Java comprobado en los seis microservicios y Keycloak de Minikube: Temurin **21.0.13+9**.
- Maven: los nueve proyectos del reactor validan la base compartida y los controles de Enforcer, incluidos los mínimos transitivos.
- JUnit/Spring: **96 tests, 0 fallos, 0 errores, 0 omitidos**. Todos se ejecutaron con Java 21.0.13. El log completo está en `reports/maven-final-verify.log`.
- Trivy 0.76.1: **0 hallazgos** en los ocho inventarios de dependencias de ejecución y en las siete imágenes de aplicación. Se incluyeron todas las severidades, también hallazgos sin corrección disponible. Informes: `reports/*-vulnerabilities.json`.
- Docker Compose y manifiestos Kubernetes: validación correcta; Kubernetes se comprobó con `--dry-run=server`.
- Keycloak: migración ensayada sobre una restauración PostgreSQL y luego aplicada a la base real. Se conservaron los cinco usuarios del realm de la tienda y sus siete clientes, además del administrador de `master`. Respaldos completos y deployment anterior en `backups/`.
- Autenticación administrativa validada antes y después de migrar. Contraseña de desarrollo reemplazada por una aleatoria almacenada en `keycloak-admin-secret`.
- Seis microservicios desplegados con etiquetas `security-20261023`; Keycloak con `26.8.1-java21.0.13`.
- Salud interna comprobada en gateway, catálogo, inventario, pedidos y pagos. Notificaciones no expone Actuator; su arranque y conexión al broker se comprobaron mediante los logs.
- HTTP local: descubrimiento OIDC de Keycloak, salud del gateway, catálogo e inventario respondieron **200**. Pedidos respondió **401** sin token, como corresponde.
- Port-forward en segundo plano: Keycloak `localhost:8080`; API Gateway `localhost:9000`.

El entorno permanece configurado para desarrollo local, con HTTP y `start-dev`. El alcance del escaneo son las dependencias Java de ejecución y las siete imágenes de aplicación, no las imágenes de bases de datos, RabbitMQ, observabilidad ni el host. Cero hallazgos conocidos no constituye una garantía de ausencia de vulnerabilidades.

Pendiente externo: `email-secret` contiene credenciales SMTP de plantilla; el envío de correo requiere configurarlas. No se realizaron cargos ni pruebas contra pagos reales.
