package com.tallerzapata.backend.api.auth;

import com.tallerzapata.backend.application.security.AuthApplicationService;
import com.tallerzapata.backend.infrastructure.security.AuthenticatedUser;
import com.tallerzapata.backend.infrastructure.security.CurrentUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Autenticacion", description = "Endpoints de autenticacion y sesion de usuarios")
public class AuthController {

    private final AuthApplicationService authApplicationService;
    private final CurrentUserService currentUserService;

    public AuthController(AuthApplicationService authApplicationService, CurrentUserService currentUserService) {
        this.authApplicationService = authApplicationService;
        this.currentUserService = currentUserService;
    }

    @Operation(summary = "Iniciar sesion", description = "Autentica un usuario con email y password, devuelve tokens JWT")
    @ApiResponse(responseCode = "200", description = "Autenticacion exitosa")
    @PostMapping("/login")
    public AuthTokenResponse login(@Valid @RequestBody LoginRequest request) {
        return authApplicationService.login(request.email(), request.password());
    }

    @Operation(summary = "Refrescar token", description = "Genera un nuevo access token a partir de un refresh token valido")
    @ApiResponse(responseCode = "200", description = "Token refrescado exitosamente")
    @PostMapping("/refresh")
    public AuthTokenResponse refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return authApplicationService.refresh(request.refreshToken());
    }

    @Operation(summary = "Cerrar sesion", description = "Invalida el refresh token y opcionalmente todas las sesiones del usuario")
    @ApiResponse(responseCode = "204", description = "Sesion cerrada exitosamente")
    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@RequestBody(required = false) LogoutRequest request) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        authApplicationService.logout(
                currentUser.id(),
                request == null ? null : request.refreshToken(),
                request != null && Boolean.TRUE.equals(request.revokeAllSessions())
        );
    }

    @Operation(summary = "Obtener usuario actual", description = "Devuelve la informacion del usuario autenticado en la sesion actual")
    @ApiResponse(responseCode = "200", description = "Usuario obtenido exitosamente")
    @GetMapping("/me")
    public AuthenticatedUserResponse me() {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        return new AuthenticatedUserResponse(
                currentUser.id().toString(),
                currentUser.displayName(),
                currentUser.role()
        );
    }
}
