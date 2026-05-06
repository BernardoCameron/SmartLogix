# Resumen del Proyecto SmartLogix y Cambios Realizados

Este documento detalla la arquitectura de microservicios de SmartLogix, los endpoints de cada servicio, y el historial de decisiones técnicas y correcciones aplicadas durante el desarrollo.

## Arquitectura General
El proyecto sigue el patrón de **Domain-Driven Design (DDD)** (usando paquetes `domain` en lugar de `model`) y una arquitectura de **microservicios contenerizados**.
- **Orquestación:** Docker Compose.
- **Base de Datos:** Un único contenedor MySQL 8.0 con aislamiento lógico (esquemas separados para cada microservicio: `inventorydb`, `orderdb`, `shipmentdb`, `authdb`).
- **Descubrimiento de Servicios:** Eureka Server (`discovery-service`).
- **Enrutamiento Centralizado:** Spring Cloud Gateway (`api-gateway`).

---

## Detalle de Microservicios, Endpoints y Ejemplos de Postman

> **Nota sobre el API Gateway:** Todas las peticiones deben enviarse al puerto **8080** (`http://localhost:8080`), ya que el API Gateway se encarga de redirigirlas internamente al microservicio correcto.

### 1. Auth Service (`/auth/**`)
Encargado de la seguridad usando **JWT (JSON Web Tokens)** y `BCrypt` para contraseñas.

* **`POST http://localhost:8080/auth/register`**
  * **Descripción:** Registra un nuevo usuario en la base de datos `authdb`.
  * **Body (JSON):**
    ```json
    {
      "username": "admin",
      "password": "123"
    }
    ```

* **`POST http://localhost:8080/auth/login`**
  * **Descripción:** Valida credenciales y retorna un token JWT firmado.
  * **Body (JSON):**
    ```json
    {
      "username": "admin",
      "password": "123"
    }
    ```
  * **Respuesta Esperada:** Un string con el Token JWT.

---

### 2. Inventory Service (`/api/inventory/**`)
Gestiona el catálogo y el stock de productos en `inventorydb`.

* **`GET http://localhost:8080/api/inventory/items`**
  * **Descripción:** Lista todos los productos disponibles en el inventario.
  * **Ejemplo Postman:** Solamente hacer un `GET http://localhost:8080/api/inventory/items`.

* **`POST http://localhost:8080/api/inventory/items`**
  * **Descripción:** Crea un nuevo producto en el catálogo.
  * **Body (JSON):**
    ```json
    {
      "sku": "SKU-9999",
      "productName": "Silla Gamer",
      "warehouseCode": "WH-SCL-01",
      "initialQuantity": 50,
      "reorderLevel": 10
    }
    ```

* **Otros métodos útiles:**
  * `GET http://localhost:8080/api/inventory/items/{sku}`: Obtiene un producto por SKU.
  * `GET http://localhost:8080/api/inventory/items/{sku}/availability?quantity=1`: Verifica si hay stock disponible.
  * `PATCH http://localhost:8080/api/inventory/items/{sku}/reserve?quantity=1`: Reserva stock manualmente.

---

### 3. Order Service (`/api/orders/**`)
Gestiona los pedidos de los clientes. Al crear un pedido, este servicio llama internamente al **Inventory Service** para validar/descontar stock y al **Shipment Service** para generar el código de envío.

* **`POST http://localhost:8080/api/orders`**
  * **Descripción:** Crea una nueva orden de compra.
  * **Body (JSON):** (Nota: Usa un SKU real que exista en inventario, como los de prueba `SKU-1001`).
    ```json
    {
      "customerName": "Juan Perez",
      "customerEmail": "juan@example.com",
      "shippingAddress": "Av. Siempreviva 742",
      "lines": [
        {
          "sku": "SKU-1001",
          "quantity": 1,
          "unitPrice": 150.00
        }
      ]
    }
    ```

* **`GET http://localhost:8080/api/orders`**
  * **Descripción:** Devuelve el historial de todas las órdenes creadas.

* **`GET http://localhost:8080/api/orders/{orderNumber}`**
  * **Descripción:** Devuelve los detalles de una orden específica buscando por su código (ej: `ORD-UUID...`).

---

### 4. Shipment Service (`/api/shipments/**`)
Gestiona la logística y entrega de las órdenes aprobadas. Usualmente es consumido de forma interna por el `order-service`, pero puedes consultarlo directamente.

* **`GET http://localhost:8080/api/shipments`**
  * **Descripción:** Lista todos los envíos generados.

* **`GET http://localhost:8080/api/shipments/{trackingCode}`**
  * **Descripción:** Obtiene la información y estado de un envío usando su código de seguimiento (generado automáticamente al crear una orden).

* **`PATCH http://localhost:8080/api/shipments/{trackingCode}/status?value=SHIPPED`**
  * **Descripción:** Actualiza el estado de un envío.
  * **Ejemplo de Parámetros URL:** `value` puede ser `PENDING`, `SHIPPED`, `DELIVERED` o `FAILED`.

### 6. Frontend (`frontend` | Puerto: 3000)
Aplicación React (Next.js v15) con Tailwind CSS y shadcn/ui.
- `/`: Dashboard principal con enlaces rápidos.
- `/login`: Formulario de inicio de sesión.
- `/register`: Formulario de creación de usuarios.
- `/orders/new`: Formulario interactivo que lee el stock real para crear pedidos.

---

## Historial de Decisiones y Cambios Realizados

A continuación se presenta el paso a paso de lo construido para levantar la infraestructura:

### Fase 0: Migración a MySQL y Gestión de Entornos
1. **Reemplazo de H2 por MySQL:** Se decidió migrar las bases de datos de su estado inicial en memoria (H2) a un motor relacional persistente y preparado para producción (MySQL 8.0).
2. **Aislamiento Lógico (Schemas):** Para optimizar recursos sin romper el principio de independencia de datos de los microservicios, se decidió utilizar un solo contenedor general de MySQL, aislando la data lógicamente a través de esquemas independientes (`inventorydb`, `orderdb`, `shipmentdb`, `authdb`), creados automáticamente al iniciar mediante un script `init.sql`.
3. **Variables de Entorno Centralizadas:** Se reemplazaron las contraseñas quemadas por un archivo `.env` en la raíz. Ahora Docker Compose lee variables seguras (`DB_USERNAME`, `DB_PASSWORD`, `MYSQL_ROOT_PASSWORD`) y las inyecta a cada microservicio como `environment` variables.

### Fase 1: Integración de Autenticación
1. **Creación del Auth Service:** Se añadió como módulo para que herede dependencias del proyecto padre.
2. **Patrón DDD:** Se mantuvo la nomenclatura en `domain` para respetar el patrón DDD del proyecto.
3. **Limpieza de Scaffolding:** Eliminamos archivos sobrantes generados por Spring Initializr (ej: `application.yaml` duplicado, gitignore, etc.) para dejar un código más limpio. 

### Fase 2: Configuración del Frontend
4. **Scaffolding de React:** Se creó una aplicación con Next.js + shadcn/ui pensada para probar visualmente el proyecto sin depender de Postman.
5. **Configuración de Ruteo en el Gateway:** Se añadió la ruta `/auth/**` en el `application.yml` del API Gateway para que el frontend pudiera alcanzar al Auth Service de forma segura por el puerto 8080.
6. **Vistas Creadas:**
   - Formularios para `Login` y `Registro`.
   - Modificación de la pantalla de `Crear Pedido` para que se conecte directamente al Inventory Service (haciendo un `GET`) y traiga los 3 productos de prueba iniciales (`SKU-1001`, `SKU-2001`, `SKU-3001`), forzando al usuario a elegir un producto real.

### Fase 3: Seguridad Avanzada y Roles (RBAC)
7. **Control de Acceso Basado en Roles (RBAC):** Se implementó un enum `Role` (`ROLE_USER`, `ROLE_ADMIN`, `ROLE_WAREHOUSE`) en el dominio de `auth-service` y se añadió a la entidad `User`. Esto permite distinguir de forma robusta los privilegios de cada cuenta.
8. **Incrustación de Roles en JWT:** El generador de tokens (`JwtUtil`) se modificó para embeber el rol del usuario directamente en los *claims* del JWT. Así, cualquier microservicio puede validar autorizaciones sin consultar nuevamente a la base de datos.
9. **Inicialización de Usuarios de Prueba (Seeding):** Se creó un script `AuthSeedConfig` que puebla la base de datos `authdb` con tres usuarios predeterminados (`admin@smartlogix.com`, `bodega@smartlogix.com` y `cliente@ejemplo.com`) al arrancar. Además, todo registro público (`/auth/register`) asigna automáticamente `ROLE_USER` por defecto.
10. **Expiración de Tokens:** Se ajustó la configuración de `jwt.expiration` a 30 minutos (`1800000` milisegundos) en el `application.yml` para limitar el tiempo de vida de las sesiones y aumentar la seguridad.

### Fase 4: Integración de Mensajería Asíncrona (RabbitMQ)
11. **Creación del RabbitMQ Service:** Se integró un nuevo módulo `rabbitmq-service` al proyecto padre. Este servicio servirá de puente para procesar colas y notificaciones.
12. **Aislamiento del Broker:** Se agregó la imagen oficial de `rabbitmq:3-management` al `docker-compose.yml` para tener un broker de mensajería asíncrono con interfaz de gestión en el puerto `15672`.
13. **Adaptación Multi-stage:** Se unificaron las dependencias (`spring-boot-starter-amqp`) y se creó un `Dockerfile` para el nuevo servicio siguiendo el estándar del resto de la plataforma.
