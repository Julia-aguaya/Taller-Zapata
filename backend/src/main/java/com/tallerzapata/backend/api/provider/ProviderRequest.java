package com.tallerzapata.backend.api.provider;

import jakarta.validation.constraints.NotBlank;
public record ProviderRequest(@NotBlank String name, String phone, String email) {}
