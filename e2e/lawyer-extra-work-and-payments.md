### E2E Tests: Trabajos y pagos extras de Abogado

**Suite ID:** `LAWYER-EXTRA-E2E`
**Feature:** Flujo completo de trabajos extras para Reclamo de Terceros por Abogado.

---

## Test Case: `LAWYER-EXTRA-001` - Activar, aceptar y cobrar un trabajo extra

**Priority:** `high`

**Tags:**
- type → @e2e
- feature → @lawyer

**Preconditions:**
- Stack E2E levantado y semilla aplicada.
- Existe `E2E-ABOGADO-EXTRAS` (caso 9506).

### Flow Steps:
1. Iniciar sesión como administrador demo.
2. Abrir el expediente de abogado y activar trabajos extras.
3. Completar y presentar el trabajo extra; aceptar por cliente.
4. Abrir Pagos y registrar el saldo del trabajo extra.

### Expected Result:
- El presupuesto extra queda aceptado.
- El pago se registra como pago adicional del cliente.
- El saldo pendiente del extra queda en cero.
