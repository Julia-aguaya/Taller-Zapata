package com.tallerzapata.backend.infrastructure.security;

import com.tallerzapata.backend.application.common.ResourceNotFoundException;
import com.tallerzapata.backend.infrastructure.persistence.security.PermissionEntity;
import com.tallerzapata.backend.infrastructure.persistence.security.PermissionRepository;
import com.tallerzapata.backend.infrastructure.persistence.security.RolePermissionEntity;
import com.tallerzapata.backend.infrastructure.persistence.security.RolePermissionRepository;
import com.tallerzapata.backend.infrastructure.persistence.security.UserEntity;
import com.tallerzapata.backend.infrastructure.persistence.security.UserRepository;
import com.tallerzapata.backend.infrastructure.persistence.security.UserRoleEntity;
import com.tallerzapata.backend.infrastructure.persistence.security.UserRoleRepository;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class UserSecurityService {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final PermissionRepository permissionRepository;

    public UserSecurityService(
            UserRepository userRepository,
            UserRoleRepository userRoleRepository,
            RolePermissionRepository rolePermissionRepository,
            PermissionRepository permissionRepository
    ) {
        this.userRepository = userRepository;
        this.userRoleRepository = userRoleRepository;
        this.rolePermissionRepository = rolePermissionRepository;
        this.permissionRepository = permissionRepository;
    }

    public Optional<UserEntity> findActiveByEmail(String email) {
        return userRepository.findByEmailIgnoreCaseAndActiveTrue(email);
    }

    public AuthenticatedUser requireAuthenticatedUser(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .filter(UserEntity::getActive)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el usuario autenticado " + userId));

        return buildAuthenticatedUser(user);
    }

    public UsernamePasswordAuthenticationToken toAuthentication(AuthenticatedUser principal) {
        return new UsernamePasswordAuthenticationToken(
                principal,
                null,
                principal.authorities().stream().map(SimpleGrantedAuthority::new).toList()
        );
    }

    public AuthenticatedUser buildAuthenticatedUser(UserEntity user) {
        List<UserRoleEntity> userRoles = userRoleRepository.findByUserIdAndActiveTrue(user.getId());
        Set<Long> roleIds = userRoles.stream().map(UserRoleEntity::getRoleId).collect(Collectors.toSet());
        List<RolePermissionEntity> rolePermissions = roleIds.isEmpty()
                ? List.of()
                : rolePermissionRepository.findByRoleIdInAndAllowFlagTrue(roleIds);
        Set<Long> permissionIds = rolePermissions.stream().map(RolePermissionEntity::getPermissionId).collect(Collectors.toSet());
        Set<String> authorities = permissionIds.isEmpty()
                ? Set.of()
                : permissionRepository.findByIdIn(permissionIds).stream().map(PermissionEntity::getCode).collect(Collectors.toSet());

        return new AuthenticatedUser(
                user.getId(),
                user.getUsername(),
                buildDisplayName(user),
                authorities
        );
    }

    private String buildDisplayName(UserEntity user) {
        if (user.getLastName() == null || user.getLastName().isBlank()) {
            return user.getFirstName();
        }
        return user.getFirstName() + " " + user.getLastName();
    }
}
