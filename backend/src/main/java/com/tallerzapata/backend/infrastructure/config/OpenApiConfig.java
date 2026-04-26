package com.tallerzapata.backend.infrastructure.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Taller Zapata API")
                        .version("1.0.0")
                        .description("API del sistema de gestion de talleres Taller Zapata. Modulos: auth, organizacion, personas, vehiculos, casos, workflow, operacion, presupuesto, repuestos, finanzas, documentos, seguros, legal, recuperos, notificaciones, parametros."))
                .addSecurityItem(new SecurityRequirement().addList("bearer-jwt"))
                .components(new Components().addSecuritySchemes("bearer-jwt",
                        new SecurityScheme().type(SecurityScheme.Type.HTTP).scheme("bearer").bearerFormat("JWT")));
    }
}
