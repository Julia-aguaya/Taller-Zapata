package com.tallerzapata.backend.api.casefile;

public record CaseTypeCatalogResponse(
        Long id,
        String code,
        String name,
        String folderPrefix,
        Integer visualOrder,
        Boolean requiresProcessing,
        Boolean requiresLawyer
) {
}
