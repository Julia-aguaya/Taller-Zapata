package com.tallerzapata.backend.api.person;

import com.tallerzapata.backend.application.person.PersonService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/persons")
@Tag(name = "Personas", description = "Gestion de personas, contactos y direcciones (clientes, proveedores, asegurados, etc.)")
public class PersonController {

    private final PersonService personService;

    public PersonController(PersonService personService) {
        this.personService = personService;
    }

    @Operation(summary = "Buscar personas", description = "Busca personas por documento o texto libre")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('persona.ver')")
    @GetMapping
    public List<PersonResponse> search(
            @RequestParam(required = false) String document,
            @RequestParam(required = false) String q
    ) {
        return personService.search(document, q);
    }

    @Operation(summary = "Obtener persona por ID", description = "Devuelve los detalles de una persona especifica")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('persona.ver')")
    @GetMapping("/{personId}")
    public PersonResponse getById(@PathVariable Long personId) {
        return personService.getById(personId);
    }

    @Operation(summary = "Crear persona", description = "Crea una nueva persona en el sistema")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('persona.crear')")
    @PostMapping
    public PersonResponse create(@Valid @RequestBody PersonUpsertRequest request) {
        return personService.create(request);
    }

    @Operation(summary = "Actualizar persona", description = "Actualiza los datos de una persona existente")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('persona.crear')")
    @PutMapping("/{personId}")
    public PersonResponse update(@PathVariable Long personId, @Valid @RequestBody PersonUpsertRequest request) {
        return personService.update(personId, request);
    }

    @Operation(summary = "Listar contactos de persona", description = "Devuelve los contactos asociados a una persona")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('persona.ver')")
    @GetMapping("/{personId}/contacts")
    public List<PersonContactResponse> listContacts(@PathVariable Long personId) {
        return personService.listContacts(personId);
    }

    @Operation(summary = "Crear contacto de persona", description = "Agrega un nuevo contacto a una persona")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('persona.crear')")
    @PostMapping("/{personId}/contacts")
    public PersonContactResponse createContact(
            @PathVariable Long personId,
            @Valid @RequestBody PersonContactUpsertRequest request
    ) {
        return personService.createContact(personId, request);
    }

    @Operation(summary = "Actualizar contacto de persona", description = "Actualiza un contacto existente de una persona")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('persona.crear')")
    @PutMapping("/{personId}/contacts/{contactId}")
    public PersonContactResponse updateContact(
            @PathVariable Long personId,
            @PathVariable Long contactId,
            @Valid @RequestBody PersonContactUpsertRequest request
    ) {
        return personService.updateContact(personId, contactId, request);
    }

    @Operation(summary = "Listar direcciones de persona", description = "Devuelve las direcciones asociadas a una persona")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('persona.ver')")
    @GetMapping("/{personId}/addresses")
    public List<PersonAddressResponse> listAddresses(@PathVariable Long personId) {
        return personService.listAddresses(personId);
    }

    @Operation(summary = "Crear direccion de persona", description = "Agrega una nueva direccion a una persona")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('persona.crear')")
    @PostMapping("/{personId}/addresses")
    public PersonAddressResponse createAddress(
            @PathVariable Long personId,
            @Valid @RequestBody PersonAddressUpsertRequest request
    ) {
        return personService.createAddress(personId, request);
    }

    @Operation(summary = "Actualizar direccion de persona", description = "Actualiza una direccion existente de una persona")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('persona.crear')")
    @PutMapping("/{personId}/addresses/{addressId}")
    public PersonAddressResponse updateAddress(
            @PathVariable Long personId,
            @PathVariable Long addressId,
            @Valid @RequestBody PersonAddressUpsertRequest request
    ) {
        return personService.updateAddress(personId, addressId, request);
    }
}
