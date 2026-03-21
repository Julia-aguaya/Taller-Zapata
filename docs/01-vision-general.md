# Vision general

## Objetivo del sistema

La plataforma debe permitir crear, gestionar, presupuestar, reparar, facturar, cobrar y cerrar casos de taller, tanto particulares como vinculados a companias de seguro o abogados.

## Problemas que debe resolver

- evitar carpetas incompletas
- ordenar urgencias y prioridades operativas
- bloquear avances cuando faltan datos criticos
- centralizar documentacion, fotos, videos y pagos
- reducir carga manual repetida entre solapas
- dar trazabilidad del estado real de cada caso

## Menu principal propuesto

- `Nuevo Caso`
- `Panel General`
- `Gestion`

## Criterios visuales

- rojo: pendiente, bloqueado, requiere accion
- verde o azul: resuelto, completado, habilitado

## Modulos principales

- autenticacion y usuarios
- talleres y sucursales
- casos o carpetas
- ficha tecnica
- presupuesto
- gestion del tramite
- gestion de reparacion
- pagos y facturacion
- agenda de tareas
- documentos y multimedia
- reportes y panel general

## Tipos de tramite detectados

- Particular
- Todo Riesgo
- Granizo
- CLEAS
- Reclamo de Tercero - Taller
- Reclamo de Tercero - Abogado
- Recupero de Franquicia

## Estrategia recomendada

Disenar una plataforma basada en un nucleo comun de casos y estados, y luego extender cada tipo de tramite con reglas especificas. Evita construir pantallas aisladas por tramite y permite reutilizar validaciones, adjuntos, agenda, pagos y trazabilidad.
