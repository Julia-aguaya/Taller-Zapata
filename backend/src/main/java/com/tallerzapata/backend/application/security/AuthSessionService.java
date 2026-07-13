package com.tallerzapata.backend.application.security;

import com.tallerzapata.backend.api.auth.AuthSessionCapabilitiesResponse;
import com.tallerzapata.backend.api.auth.AuthSessionNavigationItemResponse;
import com.tallerzapata.backend.api.auth.AuthSessionNavigationResponse;
import com.tallerzapata.backend.api.auth.AuthSessionResponse;
import com.tallerzapata.backend.api.auth.AuthSessionScopeResponse;
import com.tallerzapata.backend.api.auth.AuthSessionUserResponse;
import com.tallerzapata.backend.infrastructure.persistence.notification.NotificationRepository;
import com.tallerzapata.backend.infrastructure.persistence.organization.BranchEntity;
import com.tallerzapata.backend.infrastructure.persistence.organization.BranchRepository;
import com.tallerzapata.backend.infrastructure.persistence.security.UserRoleEntity;
import com.tallerzapata.backend.infrastructure.persistence.security.UserRoleRepository;
import com.tallerzapata.backend.infrastructure.security.AuthenticatedUser;
import com.tallerzapata.backend.infrastructure.security.CurrentUserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AuthSessionService {

    private static final Set<String> MANAGEMENT_AUTHORITIES = Set.of(
            "identity.permissions.read",
            "identity.roles.manage",
            "identity.users.manage"
    );

    private final CurrentUserService currentUserService;
    private final UserRoleRepository userRoleRepository;
    private final BranchRepository branchRepository;
    private final NotificationRepository notificationRepository;

    public AuthSessionService(
            CurrentUserService currentUserService,
            UserRoleRepository userRoleRepository,
            BranchRepository branchRepository,
            NotificationRepository notificationRepository
    ) {
        this.currentUserService = currentUserService;
        this.userRoleRepository = userRoleRepository;
        this.branchRepository = branchRepository;
        this.notificationRepository = notificationRepository;
    }

    @Transactional(readOnly = true)
    public AuthSessionResponse getCurrentSession() {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        List<UserRoleEntity> activeRoles = userRoleRepository.findByUserIdAndActiveTrue(currentUser.id());
        Map<Long, BranchEntity> branchesById = branchRepository.findAllById(
                activeRoles.stream()
                        .map(UserRoleEntity::getBranchId)
                        .filter(id -> id != null)
                        .distinct()
                        .toList()
        ).stream().collect(Collectors.toMap(BranchEntity::getId, item -> item));

        List<AuthSessionScopeResponse> scopes = activeRoles.stream()
                .map(role -> {
                    BranchEntity branch = role.getBranchId() == null ? null : branchesById.get(role.getBranchId());
                    return new AuthSessionScopeResponse(
                            role.getOrganizationId(),
                            role.getBranchId(),
                            branch == null ? null : branch.getCode(),
                            branch == null ? null : branch.getName()
                    );
                })
                .distinct()
                .sorted(Comparator.comparing(AuthSessionScopeResponse::organizationId)
                        .thenComparing(item -> item.branchId() == null ? Long.MIN_VALUE : item.branchId()))
                .toList();

        List<String> authorities = currentUser.authorities().stream().sorted().toList();
        boolean canAccessPanel = currentUser.authorities().contains("caso.ver");
        boolean canCreateCase = currentUser.authorities().contains("caso.crear");
        boolean canAccessManagement = currentUser.authorities().stream().anyMatch(MANAGEMENT_AUTHORITIES::contains);
        boolean canOverrideVisibleStates = currentUser.authorities().contains("workflow.estado.visible.override");
        boolean canForceWorkflowTransition = currentUser.authorities().contains("workflow.transicionar");
        long unreadNotifications = currentUser.authorities().contains("notificacion.ver")
                ? notificationRepository.countByUserIdAndReadFalse(currentUser.id())
                : 0L;

        List<AuthSessionNavigationItemResponse> items = List.of(
                new AuthSessionNavigationItemResponse("PANEL", "Panel general", "/panel", canAccessPanel),
                new AuthSessionNavigationItemResponse("CASES", "Carpetas", "/cases", canAccessPanel),
                new AuthSessionNavigationItemResponse("NEW_CASE", "Nuevo caso", "/cases/new", canCreateCase),
                new AuthSessionNavigationItemResponse("AGENDA", "Agenda", "/agenda", canAccessPanel),
                new AuthSessionNavigationItemResponse("MANAGEMENT", "Gestion", "/management", canAccessManagement)
        );

        String defaultRoute = canAccessPanel
                ? "/panel"
                : items.stream().filter(AuthSessionNavigationItemResponse::enabled).map(AuthSessionNavigationItemResponse::path).findFirst().orElse("/");

        return new AuthSessionResponse(
                new AuthSessionUserResponse(
                        currentUser.id().toString(),
                        currentUser.username(),
                        currentUser.displayName(),
                        normalizeRole(currentUser.role())
                ),
                authorities,
                scopes,
                new AuthSessionNavigationResponse(defaultRoute, items),
                new AuthSessionCapabilitiesResponse(
                        canCreateCase,
                        canAccessPanel,
                        canAccessManagement,
                        canOverrideVisibleStates,
                        canForceWorkflowTransition
                ),
                unreadNotifications
        );
    }

    private String normalizeRole(String role) {
        return role == null ? "OPERADOR" : role.trim().toUpperCase(Locale.ROOT);
    }
}
