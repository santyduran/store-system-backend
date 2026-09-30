# Store System — API

## Base URL

```text
http://localhost:3000
```

---

# 1. Autenticación

## Login

```text
POST http://localhost:3000/auth/login
```

### Autenticación

No requiere token.

### Body

```json
{
  "email": "admin.api@storesystem.com",
  "password": "123456"
}
```

### Respuesta

La API devuelve un `accessToken` que debe utilizarse para acceder a las rutas protegidas.

```json
{
  "accessToken": "TOKEN_GENERADO",
  "user": {
    "id": "ID_USUARIO",
    "name": "Admin API",
    "email": "admin.api@storesystem.com",
    "role": "ADMIN",
    "status": "ACTIVE"
  }
}
```

---

# 2. Autenticación de rutas protegidas

Las rutas protegidas utilizan:

```text
Authorization: Bearer <accessToken>
```

En Postman:

```text
Authorization
Type: Bearer Token
Token: <accessToken>
```

---

# 3. Users

## Crear usuario

```text
POST http://localhost:3000/users
```

### Autenticación

```text
Bearer Token
```

### Rol

```text
ADMIN
```

### Body

```json
{
  "name": "Juan Pérez",
  "email": "juan@storesystem.com",
  "password": "123456",
  "role": "CASHIER"
}
```

---

## Consultar usuarios

```text
GET http://localhost:3000/users
```

### Autenticación

```text
Bearer Token
```

### Rol

```text
ADMIN
```

---

## Consultar usuario por ID

```text
GET http://localhost:3000/users/:id
```

### Ejemplo

```text
GET http://localhost:3000/users/6ab5e3d4934144d19595202c
```

### Autenticación

```text
Bearer Token
```

### Rol

```text
ADMIN
```

---

# 4. Categories

## Crear categoría

```text
POST http://localhost:3000/categories
```

### Autenticación

```text
Bearer Token
```

### Rol

```text
ADMIN
```

### Body

```json
{
  "name": "Cuidado capilar",
  "description": "Productos para el cuidado del cabello",
  "status": "ACTIVE"
}
```

---

## Consultar categorías

```text
GET http://localhost:3000/categories
```

### Autenticación

```text
Bearer Token
```

### Rol

```text
ADMIN o CASHIER
```

---

## Consultar categoría por ID

```text
GET http://localhost:3000/categories/:id
```

### Ejemplo

```text
GET http://localhost:3000/categories/6ab58fa95adb8a67bf4562b8
```

### Autenticación

```text
Bearer Token
```

### Rol

```text
ADMIN o CASHIER
```

---

## Actualizar categoría

```text
PUT http://localhost:3000/categories/:id
```

### Ejemplo

```text
PUT http://localhost:3000/categories/6ab58fa95adb8a67bf4562b8
```

### Autenticación

```text
Bearer Token
```

### Rol

```text
ADMIN
```

### Body

```json
{
  "name": "Cuidado capilar profesional",
  "description": "Productos profesionales para el cuidado del cabello",
  "status": "ACTIVE"
}
```

---

## Eliminar categoría

```text
DELETE http://localhost:3000/categories/:id
```

### Ejemplo

```text
DELETE http://localhost:3000/categories/6ab58fa95adb8a67bf4562b8
```

### Autenticación

```text
Bearer Token
```

### Rol

```text
ADMIN
```

---

# 5. Products

## Crear producto

```text
POST http://localhost:3000/products
```

### Autenticación

```text
Bearer Token
```

### Rol

```text
ADMIN
```

### Body

```json
{
  "barcode": "7701234567891",
  "sku": "SHAMP-001",
  "name": "Shampoo Hidratante",
  "brand": "Marca Test",
  "categoryId": "ID_CATEGORIA",
  "description": "Shampoo para cabello seco",
  "purchasePrice": 15000,
  "salePrice": 25000,
  "stock": 10,
  "minStock": 2,
  "attributes": {
    "size": "500ml",
    "type": "Hidratante"
  },
  "status": "ACTIVE"
}
```

---

## Consultar productos

```text
GET http://localhost:3000/products
```

### Autenticación

```text
Bearer Token
```

### Rol

```text
ADMIN o CASHIER
```

---

## Consultar producto por ID

```text
GET http://localhost:3000/products/:id
```

### Ejemplo

```text
GET http://localhost:3000/products/6ab5f7501096a7ef473e56df
```

### Autenticación

```text
Bearer Token
```

### Rol

```text
ADMIN o CASHIER
```

---

## Actualizar producto

```text
PUT http://localhost:3000/products/:id
```

### Ejemplo

```text
PUT http://localhost:3000/products/6ab5f7501096a7ef473e56df
```

### Autenticación

```text
Bearer Token
```

### Rol

```text
ADMIN
```

### Body

```json
{
  "name": "Shampoo Hidratante Profesional",
  "salePrice": 28000,
  "minStock": 5
}
```

---

## Eliminar producto

```text
DELETE http://localhost:3000/products/:id
```

### Ejemplo

```text
DELETE http://localhost:3000/products/6ab5f7501096a7ef473e56df
```

### Autenticación

```text
Bearer Token
```

### Rol

```text
ADMIN
```

---

# 6. Inventory

## Crear movimiento de inventario

```text
POST http://localhost:3000/inventory/movements
```

### Autenticación

```text
Bearer Token
```

### Body — Entrada

```json
{
  "productId": "ID_PRODUCTO",
  "type": "IN",
  "quantity": 5,
  "reason": "Compra de mercancía"
}
```

### Body — Salida

```json
{
  "productId": "ID_PRODUCTO",
  "type": "OUT",
  "quantity": 3,
  "reason": "Salida manual"
}
```

### Body — Ajuste

```json
{
  "productId": "ID_PRODUCTO",
  "type": "ADJUSTMENT",
  "quantity": 20,
  "reason": "Conteo físico de inventario"
}
```

### Tipos disponibles

```text
IN
OUT
ADJUSTMENT
```

---

## Consultar movimientos de inventario

```text
GET http://localhost:3000/inventory/movements
```

### Autenticación

```text
Bearer Token
```

---

# 7. Sales

## Crear venta

```text
POST http://localhost:3000/sales
```

### Autenticación

```text
Bearer Token
```

### Roles

```text
ADMIN
CASHIER
```

### Body

```json
{
  "items": [
    {
      "productId": "ID_PRODUCTO",
      "quantity": 2
    }
  ],
  "discount": 0,
  "paymentMethod": "CASH"
}
```

### Métodos de pago disponibles

```text
CASH
CARD
TRANSFER
```

### Reglas

* La venta debe contener al menos un producto.
* El producto debe existir.
* El producto debe estar `ACTIVE`.
* Debe existir stock suficiente.
* El precio utilizado es el `salePrice` actual del producto.
* El precio no puede ser enviado por el cliente.
* El descuento no puede superar el subtotal.
* La venta genera automáticamente una salida de inventario.
* Las ventas en efectivo requieren una caja abierta.
* Las ventas con tarjeta o transferencia no modifican el efectivo esperado de la caja.

---

## Consultar ventas

```text
GET http://localhost:3000/sales
```

### Autenticación

```text
Bearer Token
```

---

## Consultar venta por ID

```text
GET http://localhost:3000/sales/:id
```

### Ejemplo

```text
GET http://loca
```
9. Resumen de todas las rutas
Auth
POST   http://localhost:3000/auth/login

Users
POST   http://localhost:3000/users
GET    http://localhost:3000/users
GET    http://localhost:3000/users/:id

Categories
POST   http://localhost:3000/categories
GET    http://localhost:3000/categories
GET    http://localhost:3000/categories/:id
PUT    http://localhost:3000/categories/:id
DELETE http://localhost:3000/categories/:id

Products
POST   http://localhost:3000/products
GET    http://localhost:3000/products
GET    http://localhost:3000/products/:id
PUT    http://localhost:3000/products/:id
DELETE http://localhost:3000/products/:id

Inventory
POST   http://localhost:3000/inventory/movements
GET    http://localhost:3000/inventory/movements

Sales
POST   http://localhost:3000/sales
GET    http://localhost:3000/sales
GET    http://localhost:3000/sales/:id

Cash Register
POST   http://localhost:3000/cash-register/open
GET    http://localhost:3000/cash-register/current
POST   http://localhost:3000/cash-register/close

reports 
GET    http://localhost:3000/reports/sales
GET    http://localhost:3000/reports/sales?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
GET    http://localhost:3000/reports/inventory
GET    http://localhost:3000/reports/low-stock
GET    http://localhost:3000/reports/inventory-value
GET    http://localhost:3000/reports/best-selling-products
GET    http://localhost:3000/reports/best-selling-products?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD

Configuration
PUT  http://localhost:3000/configuration