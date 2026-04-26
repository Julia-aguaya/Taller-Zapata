package com.tallerzapata.backend.application.casefile;

public final class CaseFolderCodeGenerator {

    private CaseFolderCodeGenerator() {
    }

    public static String generate(Long orderNumber, String folderPrefix, String branchCode) {
        return "%04d%s%s".formatted(orderNumber, folderPrefix == null ? "X" : folderPrefix, branchCode == null ? "NA" : branchCode);
    }
}
