import React, { useState, useEffect } from 'react';
import { validateNewCaseForm } from '../lib/validations';
import { mapClientToForm, mapVehicleToForm, mapFormToApi } from '../lib/mappers';

export function NewCaseForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    rut: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    plate: '',
    brand: '',
    model: '',
    year: '',
    incidentDate: '',
    description: '',
    incidentLocation: '',
  });
  
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsDirty(true);
  }, [formData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleClientSearch = async (rut) => {
    if (rut.length < 8) return;
    
    try {
      const res = await fetch(`/api/v1/clientes/buscar?rut=${rut}`);
      if (res.ok) {
        const data = await res.json();
        const clientData = mapClientToForm(data);
        if (clientData) {
          setFormData(prev => ({ ...prev, ...clientData }));
        }
      }
    } catch (err) {
      console.error('Error searching client:', err);
    }
  };

  const handleVehicleSearch = async (plate) => {
    if (plate.length < 6) return;
    
    try {
      const res = await fetch(`/api/v1/vehiculos/buscar?patente=${plate}`);
      if (res.ok) {
        const data = await res.json();
        const vehicleData = mapVehicleToForm(data);
        if (vehicleData) {
          setFormData(prev => ({ ...prev, ...vehicleData }));
        }
      }
    } catch (err) {
      console.error('Error searching vehicle:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validation = validateNewCaseForm(formData);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const payload = mapFormToApi(formData);
      const res = await fetch('/api/v1/casos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Error al crear caso');
      }

      const result = await res.json();
      setIsDirty(false);
      onSubmit?.(result);
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form data-testid="new-case-form" onSubmit={handleSubmit}>
      <fieldset data-testid="client-section">
        <legend>Datos del Cliente</legend>
        
        <div>
          <label htmlFor="rut">RUT</label>
          <input
            id="rut"
            value={formData.rut}
            onChange={(e) => handleChange('rut', e.target.value)}
            onBlur={(e) => handleClientSearch(e.target.value)}
          />
          {errors.rut && <span data-testid="error-rut" role="alert">{errors.rut}</span>}
        </div>

        <div>
          <label htmlFor="firstName">Nombre</label>
          <input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="lastName">Apellido</label>
          <input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
          />
          {errors.email && <span data-testid="error-email" role="alert">{errors.email}</span>}
        </div>

        <div>
          <label htmlFor="phone">Teléfono</label>
          <input
            id="phone"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
          />
          {errors.phone && <span data-testid="error-phone" role="alert">{errors.phone}</span>}
        </div>
      </fieldset>

      <fieldset data-testid="vehicle-section">
        <legend>Datos del Vehículo</legend>

        <div>
          <label htmlFor="plate">Patente</label>
          <input
            id="plate"
            value={formData.plate}
            onChange={(e) => handleChange('plate', e.target.value)}
            onBlur={(e) => handleVehicleSearch(e.target.value)}
          />
          {errors.plate && <span data-testid="error-plate" role="alert">{errors.plate}</span>}
        </div>

        <div>
          <label htmlFor="brand">Marca</label>
          <input
            id="brand"
            value={formData.brand}
            onChange={(e) => handleChange('brand', e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="model">Modelo</label>
          <input
            id="model"
            value={formData.model}
            onChange={(e) => handleChange('model', e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="year">Año</label>
          <input
            id="year"
            type="number"
            value={formData.year}
            onChange={(e) => handleChange('year', e.target.value)}
          />
        </div>
      </fieldset>

      <fieldset data-testid="incident-section">
        <legend>Incidente</legend>

        <div>
          <label htmlFor="incidentDate">Fecha del Incidente</label>
          <input
            id="incidentDate"
            type="date"
            value={formData.incidentDate}
            onChange={(e) => handleChange('incidentDate', e.target.value)}
          />
          {errors.incidentDate && <span data-testid="error-incidentDate" role="alert">{errors.incidentDate}</span>}
        </div>

        <div>
          <label htmlFor="incidentLocation">Lugar</label>
          <input
            id="incidentLocation"
            value={formData.incidentLocation}
            onChange={(e) => handleChange('incidentLocation', e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="description">Descripción</label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
          />
          {errors.description && <span data-testid="error-description" role="alert">{errors.description}</span>}
        </div>
      </fieldset>

      {isDirty && <div data-testid="dirty-indicator">Cambios sin guardar</div>}
      
      {errors.submit && (
        <div data-testid="submit-error" role="alert">
          {errors.submit}
        </div>
      )}

      <button type="submit" disabled={isSubmitting} data-testid="submit-button">
        {isSubmitting ? 'Enviando...' : 'Crear Caso'}
      </button>
    </form>
  );
}