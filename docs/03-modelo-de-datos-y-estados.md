# Modelo de datos y estados

## Caso

Todo gira alrededor de una entidad `Caso`.

Campos base recomendados:

- identificador de carpeta
- tipo de tramite
- taller
- sucursal
- cliente
- vehiculo
- referenciado
- usuario creador
- fecha de creacion
- estado de tramite
- estado de reparacion
- fecha de cierre

## Alta minima obligatoria

Para crear un caso deben exigirse:

1. tipo de tramite
2. nombre y apellido del cliente
3. marca, modelo y dominio del vehiculo
4. si es referenciado o no

## Submodelos comunes

- datos del cliente
- datos del vehiculo
- titulares registrales
- datos del siniestro
- datos del seguro
- presupuesto
- reparacion
- pagos
- documentacion
- tareas pendientes

## Solapas base

No todos los tramites usan las mismas, pero el sistema deberia soportar estas:

- `Ficha Tecnica`
- `Presupuesto`
- `Gestion del Tramite`
- `Gestion Reparacion`
- `Pagos`
- `Abogado`

## Estados principales

### Estado de tramite

Debe derivarse de eventos como:

- carpeta creada
- presentacion del tramite
- documentacion completa o incompleta
- cotizacion acordada
- pasado a pagos
- pago recibido
- rechazo o desistimiento

### Estado de reparacion

Debe derivarse de eventos como:

- carpeta creada
- seleccion de comprobante
- repuestos pendientes o recibidos
- turno asignado
- ingreso del vehiculo
- egreso definitivo
- reingreso
- no debe repararse

## Regla de cierre

La fecha de cierre del caso deberia calcularse con la ultima condicion obligatoria cumplida segun el tipo de tramite.

Ejemplo en `Particular`:

- egreso definitivo del vehiculo
- pago total del cliente

La fecha de cierre es la ultima de esas dos.

## Casos asociados

El sistema deberia permitir asociar carpetas entre si para cubrir:

- recuperos de franquicia
- casos CLEAS
- franquicias vinculadas a otro expediente
- seguimiento cruzado entre compania, cliente y taller
