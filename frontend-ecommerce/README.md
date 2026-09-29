# 🛠️ Ferrestore E-Commerce - Aplicación Cliente (Frontend)

¡Bienvenido a la interfaz de **Ferrestore**! 🚀 Una plataforma moderna, rápida y reactiva para la venta de herramientas. Este proyecto consume nuestra arquitectura de microservicios, ofreciendo una experiencia de usuario fluida, segura y escalable.

## 🌟 Objetivo del Proyecto
Construir una interfaz de usuario que no solo luzca bien, sino que sea capaz de manejar estados complejos (carritos de compra interconectados con inventario en tiempo real), autenticación delegada y flujos de pago asíncronos (MercadoPago), manteniendo un rendimiento óptimo en el navegador.

## 🚀 Tecnologías Destacadas
* **Core:** React.js con TypeScript para un tipado estático seguro y escalable.
* **Estilos:** TailwindCSS / CSS / Componentes a medida (según implementación).
* **Seguridad:** Integración con Keycloak mediante OIDC (OpenID Connect) para el manejo de sesiones con JWT.
* **Pagos:** Checkout integrado con el SDK de MercadoPago.
* **Peticiones HTTP:** Axios con interceptores para inyección automática de tokens JWT.

## 📁 Estructura de Carpetas

La arquitectura del frontend está diseñada para la escalabilidad y la reutilización de componentes:

```text
frontend-ecommerce/
├── 🗂️ public/                 # Assets estáticos y el archivo index.html.
└── 🗂️ src/
    ├── 🗂️ assets/             # Imágenes, iconos y recursos multimedia.
    ├── 🗂️ components/         # Componentes UI reutilizables (Botones, Modales, Tarjetas).
    ├── 🗂️ pages/              # Vistas principales (Home, Cart, Checkout, ProductDetails).
    ├── 🗂️ services/           # Lógica de llamadas a la API (ProductService, OrderService).
    ├── 🗂️ store/              # Estado global de la aplicación.
    ├── 🗂️ hooks/              # Custom Hooks de React (ej. useAuth, useCart).
    ├── 🗂️ types/              # Interfaces y tipos de TypeScript (ProductDTO, OrderDTO).
    ├── 🗂️ config/             # Configuraciones globales (Axios, Keycloak, MercadoPago).
    ├── 📄 App.tsx             # Componente raíz y configuración de Rutas.
    └── 📄 main.tsx            # Punto de entrada de la aplicación.
```

## 🔐 Flujo de Autenticación y Compras
1. **Login:** El usuario se autentica a través del servidor de Keycloak.
2. **Navegación:** Se obtienen los productos a través del API Gateway (que se comunica con MongoDB).
3. **Checkout:** Al finalizar, la orden se envía al backend. Debido a la arquitectura de microservicios (asíncrona), el frontend escucha el estado de la compra (Aprobada / Sin Stock) para darle feedback en tiempo real al usuario, culminando con la pasarela de MercadoPago.
