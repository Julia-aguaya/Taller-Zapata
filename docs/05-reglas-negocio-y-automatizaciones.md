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

## Trabajos accesorios en trámites con compañía

- aplican a TODO_RIESGO, GRANIZO y CLEAS; no aplican a PARTICULAR;
- se presupuestan, aceptan, cobran, anulan y documentan en un presupuesto separado del presupuesto principal;
- son una deuda exclusiva del cliente: nunca se incorporan al monto acordado, a la factura ni a la liquidación de la compañía;
- sus pagos y anulaciones no modifican franquicia, saldo de franquicia, monto facturable ni saldo de la compañía;
- el presupuesto accesorio sólo habilita su propio pago tras aceptación del cliente y conserva su propia trazabilidad documental y PDF.

## CLEAS

- el alcance `DANIO_TOTAL` se factura íntegramente a la compañía cuando el dictamen es `A_FAVOR` o `CULPA_COMPARTIDA`; el dictamen permanece visible y auditable;
- `DANIO_TOTAL` con dictamen `EN_CONTRA` no permite continuar, facturar, cobrar ni generar liquidación; el caso se cierra;
- `FRANQUICIA` con dictamen `A_FAVOR` factura a la compañía el total acordado y no genera cargo al cliente;
- `FRANQUICIA` con dictamen `EN_CONTRA` calcula el cargo del cliente como `franquicia - importe exigido por la compañía`, limitado al total de la reparación; la compañía recibe el remanente;
- las notas de crédito sólo se aplican a facturas del mismo caso, nunca superan su saldo y conservan tipo fiscal y punto de venta de la factura original;
- el pago cliente → compañía puede documentarse de forma opcional y su evidencia queda vinculada y auditada en el caso CLEAS.

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
