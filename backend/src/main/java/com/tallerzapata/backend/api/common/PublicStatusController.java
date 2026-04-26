package com.tallerzapata.backend.api.common;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Tag(name = "Estado Publico", description = "Endpoints publicos de verificacion de estado del servicio")
public class PublicStatusController {

    @Operation(summary = "Health check", description = "Verifica que el servicio este activo")
    @ApiResponse(responseCode = "200", description = "OK")
    @GetMapping("/ping")
    public PingResponse ping() {
        return new PingResponse("ok", "taller-zapata-backend");
    }

    public record PingResponse(String status, String service) {
    }
}
