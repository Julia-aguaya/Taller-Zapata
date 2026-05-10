/**
 * Ejemplo de test unitario usando la infraestructura de testing.
 * Este archivo sirve como referencia para escribir nuevos tests.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

// ==================== EJEMPLO 1: Test de helper puro ====================

/**
 * Estos tests no necesitan render ni MSW.
 * Solo prueban funciones puras del código existente.
 */
describe('Helpers de normalización', () => {
  // Estos son ejemplos basados en las funciones que ya existen en App.jsx
  // Cuando extraigas los helpers, los moverás a archivos propios

  it('debería normalizar documentos eliminando no dígitos', () => {
    // Ejemplo de cómo se vería un test de helper
    // const result = normalizeDocument('20.123.456-7');
    // expect(result).toBe('201234567');
    expect(true).toBe(true); // Placeholder hasta extraer helpers
  });

  it('debería normalizar patentes a mayúsculas sin espacios', () => {
    // const result = normalizePlate('abc 123');
    // expect(result).toBe('ABC123');
    expect(true).toBe(true); // Placeholder
  });
});

// ==================== EJEMPLO 2: Test de integración con MSW ====================

/**
 * Estos tests usan MSW para interceptar requests HTTP.
 * Útiles para probar flujos completos de datos.
 */

// Importar el servidor de MSW configurado en setupTests.js
// Esto es solo un ejemplo de cómo se vería
describe('Auth - Login', () => {
  // Nota: El servidor de MSW ya está configurado en setupTests.js
  // No hace falta inicializarlo manualmente en cada test

  it('debería mostrar mensaje de error con credenciales inválidas', async () => {
    // Este es un ejemplo de test de integración con MSW
    // En la realidad, primero extraemos el componente de login
    // y luego probamos su comportamiento

    // const user = userEvent.setup();
    // render(<LoginForm />);
    // await user.type(screen.getByLabelText(/email/i), 'wrong@test.com');
    // await user.type(screen.getByLabelText(/password/i), 'wrongpass');
    // await user.click(screen.getByRole('button', { name: /ingresar/i }));
    // await waitFor(() => {
    //   expect(screen.getByText(/credenciales inválidas/i)).toBeInTheDocument();
    // });

    expect(true).toBe(true); // Placeholder
  });
});

// ==================== EJEMPLO 3: Test de componente ====================

/**
 * Estos tests renderizan componentes de React y verifican su comportamiento.
 * Usan renderWithProviders para wraps con providers necesarios.
 */
describe('Components - StatusBadge', () => {
  it('debería renderizar el label pasado como children', () => {
    // const { getByText } = render(<StatusBadge tone="success">Activo</StatusBadge>);
    // expect(getByText('Activo')).toBeInTheDocument();

    expect(true).toBe(true); // Placeholder
  });

  it('debería aplicar clase correcta según el tono', () => {
    // const { container } = render(<StatusBadge tone="danger">Urgente</StatusBadge>);
    // expect(container.firstChild).toHaveClass('status-badge', 'danger');

    expect(true).toBe(true); // Placeholder
  });
});

// ==================== EJEMPLO 4: Test de flujo con пользователь events ====================

describe('Casos - Listado', () => {
  it('debería filtrar casos cuando el usuario escribe en búsqueda', async () => {
    // const user = userEvent.setup();
    // render(<CasesList cases={mockCases} />);
    // await user.type(screen.getByPlaceholderText(/buscar/i), 'Juan');
    // await waitFor(() => {
    //   expect(screen.getByText('ZP-2026-0001')).toBeInTheDocument();
    //   expect(screen.queryByText('ZP-2026-0002')).not.toBeInTheDocument();
    // });

    expect(true).toBe(true); // Placeholder
  });
});

// ==================== CÓMO AGREGAR NUEVOS TESTS ====================

/**
 * Pasos para agregar un nuevo test:
 *
 * 1. Crear archivo en src/test/features/[nombre-feature]/
 *    Ejemplo: src/test/features/auth/login.test.jsx
 *
 * 2. Importar las utilities necesarias:
 *    - render, screen, waitFor de '@testing-library/react'
 *    - userEvent de '@testing-library/user-event'
 *    - fixtures de '../fixtures'
 *
 * 3. Si el test necesita datos del backend, los handlers de MSW ya están activos.
 *    Solo configurar el estado del server si es necesario:
 *    server.use(http.get('/api/...', () => HttpResponse.json(...)))
 *
 * 4. Escribir el test siguiendo el patrón:
 *    - Arrange: preparar datos y componentes
 *    - Act: interacción del usuario
 *    - Assert: verificar el resultado esperado
 *
 * 5. Ejecutar con: npm run test
 */