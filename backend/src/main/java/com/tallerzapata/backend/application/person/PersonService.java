package com.tallerzapata.backend.application.person;

import com.tallerzapata.backend.api.person.PersonAddressResponse;
import com.tallerzapata.backend.api.person.PersonAddressUpsertRequest;
import com.tallerzapata.backend.api.person.PersonContactResponse;
import com.tallerzapata.backend.api.person.PersonContactUpsertRequest;
import com.tallerzapata.backend.api.person.PersonResponse;
import com.tallerzapata.backend.api.person.PersonUpsertRequest;
import com.tallerzapata.backend.application.common.ConflictException;
import com.tallerzapata.backend.application.common.ResourceNotFoundException;
import com.tallerzapata.backend.infrastructure.persistence.person.PersonAddressEntity;
import com.tallerzapata.backend.infrastructure.persistence.person.PersonAddressRepository;
import com.tallerzapata.backend.infrastructure.persistence.person.AddressTypeRepository;
import com.tallerzapata.backend.infrastructure.persistence.person.ContactTypeRepository;
import com.tallerzapata.backend.infrastructure.persistence.person.PersonContactEntity;
import com.tallerzapata.backend.infrastructure.persistence.person.PersonContactRepository;
import com.tallerzapata.backend.infrastructure.persistence.person.PersonEntity;
import com.tallerzapata.backend.infrastructure.persistence.person.PersonRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
public class PersonService {

    private final PersonRepository personRepository;
    private final PersonContactRepository personContactRepository;
    private final PersonAddressRepository personAddressRepository;
    private final ContactTypeRepository contactTypeRepository;
    private final AddressTypeRepository addressTypeRepository;

    public PersonService(
            PersonRepository personRepository,
            PersonContactRepository personContactRepository,
            PersonAddressRepository personAddressRepository,
            ContactTypeRepository contactTypeRepository,
            AddressTypeRepository addressTypeRepository
    ) {
        this.personRepository = personRepository;
        this.personContactRepository = personContactRepository;
        this.personAddressRepository = personAddressRepository;
        this.contactTypeRepository = contactTypeRepository;
        this.addressTypeRepository = addressTypeRepository;
    }

    @Transactional(readOnly = true)
    public List<PersonResponse> search(String document, String query) {
        String normalizedDocument = PersonDocumentNormalizer.normalize(document);
        String normalizedQuery = blankToNull(query);

        if (normalizedDocument != null) {
            return personRepository.findByNumeroDocumentoNormalizado(normalizedDocument)
                    .map(entity -> toResponse(entity))
                    .stream()
                    .toList();
        }

        if (normalizedQuery != null) {
            String normalizedQueryDocument = PersonDocumentNormalizer.normalize(normalizedQuery);
            return personRepository.searchAutocomplete(
                            normalizedQuery.toLowerCase(),
                            normalizedQueryDocument == null ? "" : normalizedQueryDocument,
                            PageRequest.of(0, 50)
                    )
                    .stream()
                    .map(entity -> toResponse(entity))
                    .toList();
        }

        return personRepository.findByActivoTrueOrderByIdDesc(PageRequest.of(0, 50))
                .stream()
                .map(entity -> toResponse(entity))
                .toList();
    }

    @Transactional(readOnly = true)
    public PersonResponse getById(Long personId) {
        return toResponse(getEntity(personId));
    }

    @Transactional
    public PersonResponse create(PersonUpsertRequest request) {
        validateDocumentUniqueness(request.tipoDocumentoCodigo(), request.numeroDocumento(), null);

        PersonEntity entity = new PersonEntity();
        apply(entity, request);

        return toResponse(personRepository.save(entity));
    }

    @Transactional
    public PersonResponse update(Long personId, PersonUpsertRequest request) {
        validateDocumentUniqueness(request.tipoDocumentoCodigo(), request.numeroDocumento(), personId);

        PersonEntity entity = getEntity(personId);
        apply(entity, request);

        return toResponse(personRepository.save(entity));
    }

    @Transactional(readOnly = true)
    public List<PersonContactResponse> listContacts(Long personId) {
        ensurePersonExists(personId);

        return personContactRepository.findByPersonIdOrderByPrincipalDescIdDesc(personId)
                .stream()
                .map(entity -> toResponse(entity))
                .toList();
    }

    @Transactional
    public PersonContactResponse createContact(Long personId, PersonContactUpsertRequest request) {
        ensurePersonExists(personId);
        if (request.principal() != null && request.principal()) {
            personContactRepository.resetPrincipalByPersonId(personId);
        }

        PersonContactEntity entity = new PersonContactEntity();
        entity.setPersonId(personId);
        apply(entity, request);

        return toResponse(personContactRepository.save(entity));
    }

    @Transactional
    public PersonContactResponse updateContact(Long personId, Long contactId, PersonContactUpsertRequest request) {
        ensurePersonExists(personId);
        PersonContactEntity entity = getContactEntity(personId, contactId);

        if (request.principal() != null && request.principal()) {
            personContactRepository.resetPrincipalByPersonIdAndIdNot(personId, contactId);
        }

        apply(entity, request);
        return toResponse(personContactRepository.save(entity));
    }

    @Transactional(readOnly = true)
    public List<PersonAddressResponse> listAddresses(Long personId) {
        ensurePersonExists(personId);

        return personAddressRepository.findByPersonIdOrderByPrincipalDescIdDesc(personId)
                .stream()
                .map(entity -> toResponse(entity))
                .toList();
    }

    @Transactional
    public PersonAddressResponse createAddress(Long personId, PersonAddressUpsertRequest request) {
        ensurePersonExists(personId);
        if (request.principal() != null && request.principal()) {
            personAddressRepository.resetPrincipalByPersonId(personId);
        }

        PersonAddressEntity entity = new PersonAddressEntity();
        entity.setPersonId(personId);
        apply(entity, request);

        return toResponse(personAddressRepository.save(entity));
    }

    @Transactional
    public PersonAddressResponse updateAddress(Long personId, Long addressId, PersonAddressUpsertRequest request) {
        ensurePersonExists(personId);
        PersonAddressEntity entity = getAddressEntity(personId, addressId);

        if (request.principal() != null && request.principal()) {
            personAddressRepository.resetPrincipalByPersonIdAndIdNot(personId, addressId);
        }

        apply(entity, request);
        return toResponse(personAddressRepository.save(entity));
    }

    private PersonEntity getEntity(Long personId) {
        return personRepository.findById(personId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe la persona " + personId));
    }

    private void ensurePersonExists(Long personId) {
        if (!personRepository.existsById(personId)) {
            throw new ResourceNotFoundException("No existe la persona " + personId);
        }
    }

    private PersonContactEntity getContactEntity(Long personId, Long contactId) {
        return personContactRepository.findByIdAndPersonId(contactId, personId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el contacto " + contactId + " para la persona " + personId));
    }

    private PersonAddressEntity getAddressEntity(Long personId, Long addressId) {
        return personAddressRepository.findByIdAndPersonId(addressId, personId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el domicilio " + addressId + " para la persona " + personId));
    }

    private void validateDocumentUniqueness(String documentType, String documentNumber, Long personId) {
        String normalizedDocument = PersonDocumentNormalizer.normalize(documentNumber);
        if (documentType == null || documentType.isBlank() || normalizedDocument == null) {
            return;
        }

        boolean exists = personId == null
                ? personRepository.existsByTipoDocumentoCodigoAndNumeroDocumentoNormalizado(documentType, normalizedDocument)
                : personRepository.existsByTipoDocumentoCodigoAndNumeroDocumentoNormalizadoAndIdNot(documentType, normalizedDocument, personId);

        if (exists) {
            throw new ConflictException("Ya existe una persona con ese documento");
        }
    }

    private void apply(PersonEntity entity, PersonUpsertRequest request) {
        entity.setTipoPersona(request.tipoPersona());
        entity.setNombre(blankToNull(request.nombre()));
        entity.setApellido(blankToNull(request.apellido()));
        entity.setRazonSocial(blankToNull(request.razonSocial()));
        entity.setNombreMostrar(buildDisplayName(request));
        entity.setTipoDocumentoCodigo(blankToNull(request.tipoDocumentoCodigo()));
        entity.setNumeroDocumento(blankToNull(request.numeroDocumento()));
        entity.setNumeroDocumentoNormalizado(PersonDocumentNormalizer.normalize(request.numeroDocumento()));
        entity.setCuitCuil(blankToNull(request.cuitCuil()));
        entity.setFechaNacimiento(request.fechaNacimiento());
        entity.setTelefonoPrincipal(blankToNull(request.telefonoPrincipal()));
        entity.setEmailPrincipal(blankToNull(request.emailPrincipal()));
        entity.setOcupacion(blankToNull(request.ocupacion()));
        entity.setObservaciones(blankToNull(request.observaciones()));
        entity.setActivo(request.activo() == null ? true : request.activo());
    }

    private String buildDisplayName(PersonUpsertRequest request) {
        if ("juridica".equals(request.tipoPersona())) {
            if (request.razonSocial() == null || request.razonSocial().isBlank()) {
                throw new ConflictException("Una persona juridica requiere razonSocial");
            }
            return request.razonSocial().trim();
        }

        String nombre = blankToNull(request.nombre());
        String apellido = blankToNull(request.apellido());
        if (nombre == null && apellido == null) {
            throw new ConflictException("Una persona fisica requiere nombre o apellido");
        }
        if (nombre == null) {
            return apellido;
        }
        if (apellido == null) {
            return nombre;
        }
        return nombre + " " + apellido;
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private void apply(PersonContactEntity entity, PersonContactUpsertRequest request) {
        String contactTypeCode = normalizeCode(request.tipoContactoCodigo());
        validateContactTypeCode(contactTypeCode);
        String value = request.valor().trim();
        validateContactValue(contactTypeCode, value);

        entity.setContactTypeCode(contactTypeCode);
        entity.setValue(value);
        entity.setPrincipal(Boolean.TRUE.equals(request.principal()));
        entity.setValidated(Boolean.TRUE.equals(request.validado()));
        entity.setObservaciones(blankToNull(request.observaciones()));
    }

    private void apply(PersonAddressEntity entity, PersonAddressUpsertRequest request) {
        String addressTypeCode = normalizeCode(request.tipoDomicilioCodigo());
        validateAddressTypeCode(addressTypeCode);
        validateAddressData(request);

        entity.setAddressTypeCode(addressTypeCode);
        entity.setStreet(blankToNull(request.calle()));
        entity.setNumber(blankToNull(request.numero()));
        entity.setFloor(blankToNull(request.piso()));
        entity.setApartment(blankToNull(request.depto()));
        entity.setCity(blankToNull(request.localidad()));
        entity.setProvince(blankToNull(request.provincia()));
        entity.setPostalCode(blankToNull(request.codigoPostal()));
        entity.setCountryCode(blankToNull(request.paisCodigo()));
        entity.setPrincipal(Boolean.TRUE.equals(request.principal()));
    }

    private PersonResponse toResponse(PersonEntity entity) {
        return new PersonResponse(
                entity.getId(),
                entity.getPublicId(),
                entity.getTipoPersona(),
                entity.getNombre(),
                entity.getApellido(),
                entity.getRazonSocial(),
                entity.getNombreMostrar(),
                entity.getTipoDocumentoCodigo(),
                entity.getNumeroDocumento(),
                entity.getNumeroDocumentoNormalizado(),
                entity.getCuitCuil(),
                entity.getFechaNacimiento(),
                entity.getTelefonoPrincipal(),
                entity.getEmailPrincipal(),
                entity.getOcupacion(),
                entity.getObservaciones(),
                entity.getActivo()
        );
    }

    private PersonContactResponse toResponse(PersonContactEntity entity) {
        return new PersonContactResponse(
                entity.getId(),
                entity.getPersonId(),
                entity.getContactTypeCode(),
                entity.getValue(),
                entity.getPrincipal(),
                entity.getValidated(),
                entity.getObservaciones()
        );
    }

    private PersonAddressResponse toResponse(PersonAddressEntity entity) {
        return new PersonAddressResponse(
                entity.getId(),
                entity.getPersonId(),
                entity.getAddressTypeCode(),
                entity.getStreet(),
                entity.getNumber(),
                entity.getFloor(),
                entity.getApartment(),
                entity.getCity(),
                entity.getProvince(),
                entity.getPostalCode(),
                entity.getCountryCode(),
                entity.getPrincipal()
        );
    }

    private String normalizeCode(String code) {
        return code == null ? null : code.trim().toUpperCase();
    }

    private void validateContactTypeCode(String contactTypeCode) {
        if (contactTypeCode == null || !contactTypeRepository.existsByCodeAndActiveTrue(contactTypeCode)) {
            throw new ConflictException("tipoContactoCodigo no permitido: " + contactTypeCode);
        }
    }

    private void validateAddressTypeCode(String addressTypeCode) {
        if (addressTypeCode == null || !addressTypeRepository.existsByCodeAndActiveTrue(addressTypeCode)) {
            throw new ConflictException("tipoDomicilioCodigo no permitido: " + addressTypeCode);
        }
    }

    private void validateContactValue(String contactTypeCode, String value) {
        if ("EMAIL".equals(contactTypeCode) && !value.contains("@")) {
            throw new ConflictException("El contacto EMAIL debe tener un formato valido");
        }

        if (Set.of("TELEFONO", "CEL", "CELULAR", "WHATSAPP").contains(contactTypeCode)) {
            String normalized = value.replaceAll("[^0-9]", "");
            if (normalized.length() < 8 || normalized.length() > 20) {
                throw new ConflictException("El contacto telefonico debe tener entre 8 y 20 digitos");
            }
        }
    }

    private void validateAddressData(PersonAddressUpsertRequest request) {
        boolean hasAddressData = blankToNull(request.calle()) != null
                || blankToNull(request.localidad()) != null
                || blankToNull(request.provincia()) != null
                || blankToNull(request.codigoPostal()) != null;

        if (!hasAddressData) {
            throw new ConflictException("El domicilio requiere al menos calle, localidad, provincia o codigoPostal");
        }
    }
}
