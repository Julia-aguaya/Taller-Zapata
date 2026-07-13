package com.tallerzapata.backend.api.panel;

import com.tallerzapata.backend.application.panel.PanelGeneralService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/panel")
@Tag(name = "Panel", description = "Bootstrap del panel general y prioridades operativas")
public class PanelController {

    private final PanelGeneralService panelGeneralService;

    public PanelController(PanelGeneralService panelGeneralService) {
        this.panelGeneralService = panelGeneralService;
    }

    @Operation(summary = "Obtener panel general", description = "Devuelve resumen operativo y buckets de prioridad para el usuario actual")
    @ApiResponse(responseCode = "200", description = "OK")
    @GetMapping("/general")
    public PanelGeneralResponse getGeneralPanel() {
        return panelGeneralService.getGeneralPanel();
    }
}
