package com.tallerzapata.backend.infrastructure.security;

import com.tallerzapata.backend.application.common.ResourceNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class CurrentUserService {

    public AuthenticatedUser requireCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser principal)) {
            throw new ResourceNotFoundException("No hay usuario autenticado en el contexto");
        }
        return principal;
    }
}
