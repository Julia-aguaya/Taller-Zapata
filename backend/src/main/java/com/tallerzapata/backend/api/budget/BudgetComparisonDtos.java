package com.tallerzapata.backend.api.budget;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public final class BudgetComparisonDtos {
    private BudgetComparisonDtos() { }
    public record Snapshot(Long id, Integer generation, LocalDate budgetDate, Integer budgetVersion, String mode, int importedPieceCount, String context) { }
    public record ProviderColumn(Long id, Long providerId, String name, String billingCode, String paymentMethodCode, long priceCount) { }
    public record Cell(Long providerColumnId, BigDecimal amount, boolean minimum) { }
    public record Piece(Long id, String description, String actionCode, BigDecimal sourcePartValue, String origin, List<Cell> cells) { }
    public record Detail(Snapshot snapshot, List<ProviderColumn> providers, List<Piece> pieces, BigDecimal bestPriceSubtotal) { }
    public record ExtraSelection(Long extraBudgetItemId, Long providerId, String providerName, BigDecimal amount) { }
    public record ManualPieceRequest(@NotBlank String description) { }
    public record ProviderRequest(@NotNull Long providerId, @NotBlank String billingCode, @NotBlank String paymentMethodCode) { }
    public record TermsRequest(@NotBlank String billingCode, @NotBlank String paymentMethodCode) { }
    public record PriceRequest(@NotNull @DecimalMin(value = "0.00") BigDecimal amount) { }
    public record LegacyOffer(Long id, Long providerId, String providerName, BigDecimal amount, String billingCode, String paymentMethodCode) { }
    public record LegacyAudit(Snapshot snapshot, List<Piece> pieces, List<LegacyOffer> offers) { }
}
