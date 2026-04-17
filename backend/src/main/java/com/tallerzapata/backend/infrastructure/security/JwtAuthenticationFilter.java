package com.tallerzapata.backend.infrastructure.security;

import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenService jwtTokenService;
    private final UserSecurityService userSecurityService;

    public JwtAuthenticationFilter(JwtTokenService jwtTokenService, UserSecurityService userSecurityService) {
        this.jwtTokenService = jwtTokenService;
        this.userSecurityService = userSecurityService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ") && SecurityContextHolder.getContext().getAuthentication() == null) {
            String token = header.substring(7);
            try {
                Long userId = jwtTokenService.extractUserId(token);
                AuthenticatedUser user = userSecurityService.requireAuthenticatedUser(userId);
                SecurityContextHolder.getContext().setAuthentication(userSecurityService.toAuthentication(user));
            } catch (JwtException | IllegalArgumentException ignored) {
            }
        }

        filterChain.doFilter(request, response);
    }
}
