package com.tallerzapata.backend.infrastructure.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Profile;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@Profile("test")
public class HeaderAuthenticationFilter extends OncePerRequestFilter {

    public static final String USER_ID_HEADER = "X-User-Id";

    private final UserSecurityService userSecurityService;

    public HeaderAuthenticationFilter(UserSecurityService userSecurityService) {
        this.userSecurityService = userSecurityService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String userIdHeader = request.getHeader(USER_ID_HEADER);

        if (userIdHeader != null && !userIdHeader.isBlank() && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                Long userId = Long.valueOf(userIdHeader.trim());
                AuthenticatedUser principal = userSecurityService.requireAuthenticatedUser(userId);
                SecurityContextHolder.getContext().setAuthentication(userSecurityService.toAuthentication(principal));
            } catch (NumberFormatException ignored) {
            } catch (RuntimeException ignored) {
            }
        }

        filterChain.doFilter(request, response);
    }

}
