# Flujos por tramite

## 1. Particular

Solapas:

- Ficha Tecnica
- Presupuesto
- Gestion Reparacion
- Pagos

Reglas clave:

- `Presupuesto` debe completarse antes de entrar a `Gestion Reparacion`
- `Pagos` puede abrirse aunque este en rojo
- cierre cuando hay egreso definitivo y pago total

## 2. Todo Riesgo

Agrega:

- `Gestion del Tramite`
- franquicia
- presentacion y seguimiento ante compania

Reglas clave:

- prescripcion a 1 ano desde fecha del siniestro
- no avanzar si falta fecha de presentacion
- no dar turno si no hay acuerdo o autorizacion requerida

## 3. Granizo

Es variante de `Todo Riesgo` con estas diferencias:

- sin franquicia
- sin subsolapa de datos del siniestro
- identificacion con letra `G`

## 4. CLEAS

Variables criticas:

- sobre dano total o sobre franquicia
- dictamen a favor o en contra

Reglas clave:

- con dictamen pendiente o en contra pueden bloquearse avances
- en algunos escenarios el caso se cierra sin reparacion
- formulas de pago y facturacion dependen de franquicia y compensacion

## 5. Reclamo de Tercero - Taller

Reglas clave:

- prescripcion a 3 anos
- documentacion puede quedar manualmente marcada como completa o incompleta
- planilla de cotizaciones y gestion de pedidos de repuestos mas avanzada
- debe contemplar titulares registrales y porcentajes de titularidad

## 6. Reclamo de Tercero - Abogado

Agrega:

- solapa `Abogado`
- instancia administrativa o judicial
- lesionados
- expediente, cierre y erogaciones

Reglas clave:

- si no repara vehiculo, la reparacion puede marcarse como `No debe repararse`
- pagos pueden referenciar CUIJ o numero de siniestro segun instancia

## 7. Recupero de Franquicia

Reglas clave:

- puede gestionarlo taller o abogado
- puede asociarse a otra carpeta
- puede incluir o no el flujo de reparacion segun monto y contexto

## Orden sugerido de implementacion

1. Particular
2. Todo Riesgo
3. Granizo
4. CLEAS
5. Reclamo de Tercero - Taller
6. Reclamo de Tercero - Abogado
7. Recupero de Franquicia
