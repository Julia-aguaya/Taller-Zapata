package com.tallerzapata.backend.api.budget;

import com.tallerzapata.backend.application.budget.PartSupplierQuoteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Cotizaciones de Repuestos", description = "Gestion de cotizaciones por proveedor para cada repuesto")
public class PartSupplierQuoteController {
    private final PartSupplierQuoteService quoteService;

    public PartSupplierQuoteController(PartSupplierQuoteService quoteService) {
        this.quoteService = quoteService;
    }

    @Operation(summary = "Listar cotizaciones", description = "Devuelve las cotizaciones de un repuesto")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('presupuesto.ver')")
    @GetMapping("/cases/{caseId}/parts/{partId}/quotes")
    public List<PartSupplierQuoteResponse> listQuotes(@PathVariable Long caseId, @PathVariable Long partId) {
        return quoteService.listQuotes(caseId, partId);
    }

    @Operation(summary = "Crear cotizacion", description = "Agrega una cotizacion de proveedor a un repuesto")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "409", description = "Codigo de catalogo invalido")
    @PreAuthorize("hasAuthority('presupuesto.crear')")
    @PostMapping("/cases/{caseId}/parts/{partId}/quotes")
    public PartSupplierQuoteResponse createQuote(@PathVariable Long caseId, @PathVariable Long partId, @Valid @RequestBody PartSupplierQuoteCreateRequest request, HttpServletRequest httpRequest) {
        return quoteService.createQuote(caseId, partId, request, httpRequest);
    }

    @Operation(summary = "Eliminar cotizacion", description = "Elimina una cotizacion de proveedor")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "404", description = "Cotizacion no encontrada")
    @PreAuthorize("hasAuthority('presupuesto.crear')")
    @DeleteMapping("/cases/{caseId}/parts/{partId}/quotes/{quoteId}")
    public void deleteQuote(@PathVariable Long caseId, @PathVariable Long partId, @PathVariable Long quoteId, HttpServletRequest httpRequest) {
        quoteService.deleteQuote(caseId, partId, quoteId, httpRequest);
    }

    @Operation(summary = "Mejor subtotal", description = "Devuelve la suma de las mejores cotizaciones de todos los repuestos del caso")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('presupuesto.ver')")
    @GetMapping("/cases/{caseId}/parts/quotes/best-subtotal")
    public PartQuotesBestSubtotalResponse getBestSubtotal(@PathVariable Long caseId) {
        return quoteService.getBestSubtotal(caseId);
    }

    @Operation(summary = "Catalogos de cotizaciones", description = "Devuelve catalogos de facturacion y medios de pago para cotizaciones")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasAuthority('presupuesto.ver')")
    @GetMapping("/budget/quote-catalogs")
    public QuoteCatalogsResponse getCatalogs() {
        return quoteService.getCatalogs();
    }
}
