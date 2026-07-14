# Documentación de Arquitectura de Capas Frontend

## Objetivo del Documento
El presente documento tiene como finalidad establecer y describir formalmente la arquitectura por capas implementada en el frontend del proyecto SmartLogix. Esta estructura busca garantizar el desacoplamiento entre las peticiones de red, la lógica de negocio y la interfaz de usuario.

## Justificación
Anteriormente, los componentes de la interfaz de usuario realizaban llamadas de red de manera directa. Esto generaba un alto nivel de acoplamiento, dificultaba la mantenibilidad, impedía la reutilización de código y complicaba la gestión centralizada de configuraciones y errores. Con esta nueva arquitectura, se establecen responsabilidades claras para cada componente del sistema.

## Estructura de Capas

El diseño se compone de tres capas principales:

### 1. Capa API (Carpeta `api`)
Es la capa de nivel más bajo en relación con el cliente. Su responsabilidad exclusiva es gestionar las comunicaciones a través del protocolo HTTP.
*   **Gestión Centralizada:** Todas las peticiones se construyen a través de un cliente central (`client.ts`), el cual permite configurar interceptores (middlewares) para el manejo de cabeceras, tiempos de respuesta y códigos de estado.
*   **Modularidad:** Los puntos de acceso (endpoints) se encuentran separados por dominio funcional (ej. autenticación, pedidos, inventario, envíos).
*   **Abstracción:** Esta capa no posee conocimiento alguno sobre la presentación ni el formato final que requiere la interfaz de usuario.

### 2. Capa Service (Carpeta `services`)
Actúa como intermediario indispensable entre la capa de interfaz y la capa API.
*   **Consumo de API:** Consume los métodos expuestos por la capa API.
*   **Lógica y Formateo:** Aplica reglas de negocio y formatea los datos obtenidos del servidor para que sean adecuados para la presentación.
*   **Manejo de Errores:** Interpreta los errores de la capa API y los transmite a la capa superior en un formato coherente.

### 3. Capa de Presentación (Carpetas `app` y `components`)
Es la capa superior, responsable de la interfaz gráfica y de la interacción directa con el usuario final.
*   **Desacoplamiento:** Carece de acceso directo a las peticiones HTTP y a las direcciones URL.
*   **Consumo de Servicios:** Se comunica exclusivamente mediante los métodos provistos por la capa Service.
*   **Gestión de Estado Local:** Administra el estado visual de la aplicación, como indicadores de carga, alertas y el renderizado de datos.

## Medidas y Buenas Prácticas Adoptadas

Para simular un entorno real y asegurar buenas prácticas en el ciclo de vida del desarrollo, se han adoptado las siguientes medidas:

*   **Uso de Variables de Entorno:** Se implementa el uso de archivos `.env` (como `.env.local` en el entorno de desarrollo). Esto permite definir variables críticas, como la URL base del servidor (`NEXT_PUBLIC_API_URL`), fuera del código fuente. De este modo, el aplicativo se adapta a diferentes entornos (Desarrollo, Pruebas, Producción) sin necesidad de alterar el código.
*   **Centralización de Errores:** A través del cliente de peticiones unificado, se facilita la captura global de errores de red y de autorización.
*   **Mantenibilidad:** La separación de responsabilidades asegura que un cambio en la estructura del servidor únicamente requiera la actualización en la capa API o Service correspondiente, sin afectar los componentes visuales.
