# Actualización de seguridad — 23 de octubre de 2026

Todos los módulos heredan `../pom.xml`. Compilación y ejecución permanecen en **Java 21**.

| Componente | Versión |
| --- | --- |
| Spring Boot | 4.1.2 |
| Spring Cloud | 2025.1.4 |
| JDK Windows | Liberica 21.0.13+11 |
| JRE de los contenedores | Temurin 21.0.13+9 |
| Keycloak | 26.8.1 |
| MercadoPago SDK | 3.7.0 |
| Cloudinary | cloudinary-http5 2.5.0 |
| Springdoc | 3.1.1 |
| RabbitMQ Java client | 5.37.0 |
| Jackson 2 BOM | 2.22.3 |
| Gson | 2.14.0 |
| Commons BeanUtils | 1.11.0 |

El POM también alinea HK2 4.0.3 con Jersey y las anotaciones Error Prone 2.48.0 con Gson. HttpClient 4.5.14 se administra solo para sus consumidores transitivos antiguos. Se quitaron las declaraciones directas innecesarias. La instrumentación de OpenTelemetry 2.28.0-alpha permanece alineada con la API 1.62.0 administrada por Boot; su appender aún lleva sufijo alpha upstream.

Maven Enforcer comprueba Java 21, Maven 3.9.16+, dependencias duplicadas, versiones transitivas inferiores a las requeridas y las versiones vulnerables identificadas. `verify` genera `target/bom.json` en cada módulo. El inventario y su escaneo cubren las dependencias de ejecución; las imágenes se escanean por separado para incluir paquetes del sistema operativo y JAR empaquetados. Los informes completos, herramientas y respaldos están excluidos de Git.

## Compilar, probar y auditar

En una terminal PowerShell nueva, seleccionar explícitamente el JDK 21 evita que el `javapath` antiguo de Oracle seleccione Java 8:

```powershell
$env:JAVA_HOME = "$env:LOCALAPPDATA\Programs\Java\jdk-21.0.13"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
java -version
powershell -ExecutionPolicy Bypass -File scripts/verify.ps1 -JavaHome "$env:JAVA_HOME"
powershell -ExecutionPolicy Bypass -File scripts/scan.ps1
```

La política Bypass se limita al proceso de estos scripts locales; no cambia la política del sistema. Las pruebas de catálogo usan un MongoDB temporal de Testcontainers. Las pruebas de inventario y pedidos usan H2 aislado; no sustituyen las comprobaciones posteriores contra MySQL/PostgreSQL de Minikube. Los tests no acceden a las bases reales.

Trivy 0.76.1 se instala en `.tools/trivy/trivy.exe` desde su [release oficial](https://github.com/aquasecurity/trivy/releases/tag/v0.76.1), verificando SHA-256. Los escaneos no ignoran severidades ni vulnerabilidades sin parche. Un fallo del escáner o un hallazgo devuelve error.

## Construir y desplegar

Los Dockerfiles de los servicios se consolidaron en el Dockerfile raíz. Todos los builds usan la raíz como contexto:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/build-images.ps1
powershell -ExecutionPolicy Bypass -File scripts/scan.ps1 -Images
powershell -ExecutionPolicy Bypass -File scripts/deploy-services.ps1
```

Tras completar los rollouts, `powershell -ExecutionPolicy Bypass -File scripts/start-port-forwards.ps1` restablece Keycloak en `localhost:8080` y API Gateway en `localhost:9000`, en segundo plano y con logs en `security/reports/`.

Para construir un único servicio desde fuentes:

```powershell
docker build --build-arg SERVICE=api-gateway -t api-gateway:security-20261023 .
```

`build-images.ps1` empaqueta los JAR que se verificaron localmente mediante el target `local`. Los servicios se ejecutan sin root. Las imágenes son para **linux/amd64**, la arquitectura del Minikube verificado. Los binarios Temurin se verifican con SHA-256 y la base Alpine se fija por digest: las etiquetas Docker Temurin 21.0.13 aún no estaban publicadas durante la actualización.

La imagen personalizada de Keycloak copia la distribución oficial 26.8.1 sobre Alpine y Temurin 21.0.13. Esto evita conservar el JRE viejo y los paquetes vulnerables de la imagen original. Es un runtime personalizado: futuras actualizaciones requieren volver a comprobar arranque, migración y autenticación. El entorno sigue configurado para desarrollo local (`start-dev`, HTTP); estos cambios no convierten la instalación en una configuración de producción.

## Migración de Keycloak

Las plantillas de secretos están en `K8s/templates/` y no se aplican con `kubectl apply -f K8s/`. Durante la actualización se reemplazó la contraseña de desarrollo del administrador `admin` del realm `master` por una aleatoria, guardada únicamente en `keycloak-admin-secret`. La cuenta de administrador de la tienda en `ecommerce-realm` no cambió. Los pods nuevos del gateway toman sus credenciales del mismo Secret.

```powershell
minikube image load ferrestore-keycloak:26.8.1-java21.0.13
powershell -ExecutionPolicy Bypass -File scripts/keycloak-upgrade.ps1 -Mode Prepare
```

Prepare crea un respaldo PostgreSQL completo en `security/backups/`, lo restaura en `keycloak_upgrade_20261023` y arranca `keycloak-upgrade-check`. Validar salud, descubrimiento OIDC, autenticación y cantidad de usuarios/clientes; registrar el resultado en `security/reports/keycloak-migration-check.json`. Solo entonces:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/keycloak-upgrade.ps1 -Mode Deploy
kubectl --context minikube rollout status deployment/keycloak
```

Deploy toma otro respaldo inmediatamente antes de migrar la base real. La estrategia Recreate evita ejecutar simultáneamente versiones con esquemas distintos. El nombre del archivo importado debe ser `ecommerce-realm-realm.json`; la clave del ConfigMap conserva `ecommerce-realm.json`. Las opciones de hostname v1 se reemplazan por hostname v2 con URL completa; los probes usan el puerto de gestión 9000.

Una base ya migrada no admite volver simplemente a la imagen vieja. Una recuperación exige detener Keycloak y restaurar tanto el respaldo PostgreSQL como la versión anterior del deployment. Los respaldos contienen información sensible y deben mantenerse privados.

El deployment de catálogo utiliza variables Spring y referencias a Secrets para MongoDB; no coloca contraseñas en `JAVA_TOOL_OPTIONS`, porque la JVM imprime esa variable al arrancar.

## Configuración pendiente

`email-secret` todavía contiene usuario y contraseña de plantilla. El servicio de notificaciones arranca, pero Gmail rechaza sus intentos de envío. Se requieren credenciales SMTP reales para verificar el correo. No se ejecutaron pagos reales durante la validación.

## Fuentes

- [Java: CVE-2026-91403](https://www.oracle.com/security-alerts/alert-cve-2026-91403.html)
- [Publicación Temurin y parche eMudhra](https://github.com/adoptium/adoptium/wiki/Adoptium-Release-Scorecards)
- [Liberica: actualización de octubre](https://bell-sw.com/blog/liberica-jdk-8u512-11-0-33-17-0-21-21-0-13-25-0-5-and-27-0-1-builds-are-generally-available/)
- [Versiones de Spring](https://spring.io/projects/)
- [Keycloak 26.8.1](https://www.keycloak.org/2026/10/keycloak-2681-released)
- [Cloudinary: cambios de seguridad y cliente HTTP](https://github.com/cloudinary/cloudinary_java/blob/master/CHANGELOG.md)
