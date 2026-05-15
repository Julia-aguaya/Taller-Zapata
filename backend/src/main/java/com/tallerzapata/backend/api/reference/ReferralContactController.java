package com.tallerzapata.backend.api.reference;

import com.tallerzapata.backend.application.reference.ReferralContactService;
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
@RequestMapping("/api/v1/referral-contacts")
@Tag(name = "Referenciados", description = "Catalogo general de referenciados reutilizables")
public class ReferralContactController {

    private final ReferralContactService referralContactService;

    public ReferralContactController(ReferralContactService referralContactService) {
        this.referralContactService = referralContactService;
    }

    @Operation(summary = "Buscar referenciados", description = "Devuelve referenciados activos por texto libre")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('referenciado.ver')")
    @GetMapping
    public List<ReferralContactResponse> search(@RequestParam(required = false, name = "q") String query) {
        return referralContactService.search(query);
    }

    @Operation(summary = "Crear referenciado", description = "Crea un nuevo referenciado del catálogo")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('referenciado.gestionar')")
    @PostMapping
    public ReferralContactResponse create(@Valid @RequestBody ReferralContactUpsertRequest request) {
        return referralContactService.create(request);
    }

    @Operation(summary = "Actualizar referenciado", description = "Actualiza un referenciado existente")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('referenciado.gestionar')")
    @PutMapping("/{referralId}")
    public ReferralContactResponse update(@PathVariable Long referralId, @Valid @RequestBody ReferralContactUpsertRequest request) {
        return referralContactService.update(referralId, request);
    }
}
