package com.tallerzapata.backend.api.identity;

import com.tallerzapata.backend.application.security.IdentityAdminService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class IdentityController {

    private final IdentityAdminService identityAdminService;

    public IdentityController(IdentityAdminService identityAdminService) {
        this.identityAdminService = identityAdminService;
    }

    @GetMapping("/permissions")
    public List<PermissionResponse> listPermissions() {
        return identityAdminService.listPermissions();
    }

    @GetMapping("/users/{userId}/roles")
    public List<UserRoleAssignmentResponse> listUserRoles(@PathVariable Long userId) {
        return identityAdminService.listUserRoles(userId);
    }

    @PutMapping("/users/{userId}/roles")
    public List<UserRoleAssignmentResponse> updateUserRoles(
            @PathVariable Long userId,
            @Valid @RequestBody UserRolesUpdateRequest request
    ) {
        return identityAdminService.updateUserRoles(userId, request);
    }
}
