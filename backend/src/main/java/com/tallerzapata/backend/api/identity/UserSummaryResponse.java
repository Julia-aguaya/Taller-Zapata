package com.tallerzapata.backend.api.identity;

public record UserSummaryResponse(
        Long id,
        String publicId,
        String username,
        String email,
        String firstName,
        String lastName,
        Boolean active
) {
}
