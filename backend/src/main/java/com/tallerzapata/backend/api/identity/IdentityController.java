package com.tallerzapata.backend.api.identity;

import com.tallerzapata.backend.application.security.IdentityAdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Organizacion y Permisos", description = "Gestion de organizaciones, sucursales, permisos y roles de usuarios")
public class IdentityController {

    private final IdentityAdminService identityAdminService;

    public IdentityController(IdentityAdminService identityAdminService) {
        this.identityAdminService = identityAdminService;
    }

    @Operation(summary = "Listar permisos", description = "Devuelve el listado de todos los permisos del sistema")
    @ApiResponse(responseCode = "200", description = "OK")
    @GetMapping("/permissions")
    public List<PermissionResponse> listPermissions() {
        return identityAdminService.listPermissions();
    }

    @Operation(summary = "Listar organizaciones", description = "Devuelve el listado de todas las organizaciones")
    @ApiResponse(responseCode = "200", description = "OK")
    @GetMapping("/organizations")
    public List<OrganizationResponse> listOrganizations() {
        return identityAdminService.listOrganizations();
    }

    @Operation(summary = "Listar sucursales", description = "Devuelve el listado de sucursales, opcionalmente filtradas por organizacion")
    @ApiResponse(responseCode = "200", description = "OK")
    @GetMapping("/branches")
    public List<BranchResponse> listBranches(@RequestParam(name = "organizationId", required = false) Long organizationId) {
        return identityAdminService.listBranches(organizationId);
    }

    @Operation(summary = "Listar roles de usuario", description = "Devuelve los roles asignados a un usuario especifico")
    @ApiResponse(responseCode = "200", description = "OK")
    @GetMapping("/users/{userId}/roles")
    public List<UserRoleAssignmentResponse> listUserRoles(@PathVariable Long userId) {
        return identityAdminService.listUserRoles(userId);
    }

    @Operation(summary = "Actualizar roles de usuario", description = "Modifica los roles asignados a un usuario especifico")
    @ApiResponse(responseCode = "200", description = "OK")
    @PutMapping("/users/{userId}/roles")
    public List<UserRoleAssignmentResponse> updateUserRoles(
            @PathVariable Long userId,
            @Valid @RequestBody UserRolesUpdateRequest request
    ) {
        return identityAdminService.updateUserRoles(userId, request);
    }
}
