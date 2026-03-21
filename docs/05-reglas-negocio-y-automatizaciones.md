# Reglas de negocio y automatizaciones

## Bloqueos funcionales

- no crear carpeta sin datos minimos
- no pasar a otra solapa si la actual requiere cierre obligatorio
- no agregar una nueva linea de presupuesto si la anterior esta incompleta
- no generar PDF de presupuesto sin `Informe Cerrado`
- no agendar turno si faltan datos obligatorios
- no avanzar gestion ante compania sin presentacion o dictamen, segun tramite

## Campos condicionales

Deben mostrarse solo cuando corresponda, por ejemplo:

- referenciado -> nombre de quien refiere
- sena -> monto y fecha
- bonificacion -> monto, fecha y motivo
- otro medio de pago -> detalle
- factura = si -> razon social y numero
- observaciones = si -> detalle
- titular distinto del cliente -> datos del titular
- lesionados -> datos de lesionados

## Automatizaciones requeridas

- calculo de prescripcion
- calculo de dias tramitando
- calculo de salida estimada por dias habiles
- suma de repuestos
- calculo de IVA sobre mano de obra
- saldo deudor
- total cotizado
- final a favor del taller
- estado consolidado de repuestos
- estados automaticos de tramite y reparacion
- fecha de cierre del caso

## Alertas y notificaciones

Conviene implementar eventos para:

- documentacion incompleta al ingresar al caso
- acuerdo por debajo de minimos
- turno con repuestos pendientes
- desvio que requiere autorizacion superior
- tareas pendientes por usuario

## PDFs y exportes

Minimo recomendado:

- presupuesto
- recibo o comprobante de pago
- etiquetas de repuestos
- descarga masiva de documentacion
- exporte Excel para planillas puntuales

## Permisos especiales

Solo perfiles con permisos altos deberian poder:

- rechazar o desistir casos
- aprobar excepciones
- forzar avances bloqueados
- autorizar turnos sin acuerdo completo
- operar sobre multiples talleres si corresponde
