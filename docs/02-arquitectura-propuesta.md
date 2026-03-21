# Arquitectura propuesta

## Enfoque

Conviene un modelo modular orientado a dominio, no una app separada por cada tramite.

## Capas sugeridas

### 1. Core de negocio

- casos
- clientes
- vehiculos
- talleres
- usuarios
- estados
- adjuntos
- auditoria

### 2. Modulos funcionales

- presupuesto
- gestion del tramite
- gestion de reparacion
- pagos
- agenda de tareas
- reportes

### 3. Configuracion y catalogos

- tipos de tramite
- estados
- companias
- marcas
- medios de pago
- comprobantes
- roles y permisos

## Entidades principales

- `Taller`
- `Sucursal`
- `Usuario`
- `Rol`
- `Caso`
- `CasoTipo`
- `Cliente`
- `TitularRegistral`
- `Vehiculo`
- `Presupuesto`
- `PresupuestoItem`
- `Repuesto`
- `Turno`
- `Ingreso`
- `Egreso`
- `Pago`
- `Factura`
- `Documento`
- `TareaPendiente`
- `CompaniaSeguro`
- `Abogado`

## Principios tecnicos

- reglas de negocio en backend, no solo en frontend
- auditoria de cambios en acciones sensibles
- estados derivados por eventos siempre que sea posible
- catalogos configurables desde administracion
- exportes PDF y Excel desacoplados del flujo principal
- almacenamiento de archivos con metadatos por categoria

## Identificacion de carpetas

Formato sugerido:

`NNNN + tipo + sucursal`

Ejemplos:

- `0001PZ`
- `0002TZ`
- `0003PC`

Requisitos:

- numeracion correlativa unica por taller
- compartida entre sucursales del mismo taller
- prefijo por tipo de tramite
- sufijo por sucursal o unidad operativa

## Recomendacion de stack

Si arrancan de cero, conviene una app web con:

- backend con API y motor de reglas
- frontend con formularios dinamicos por schema
- base relacional para estados, pagos y trazabilidad
- almacenamiento de archivos separado

No hace falta definir tecnologia ahora, pero si modelar bien dominio, permisos y eventos.
