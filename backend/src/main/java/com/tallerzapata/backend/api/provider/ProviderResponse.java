package com.tallerzapata.backend.api.provider;
public record ProviderResponse(Long id, String publicId, String name, String phone, String email, Boolean active) {}
