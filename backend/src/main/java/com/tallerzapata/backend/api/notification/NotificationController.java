package com.tallerzapata.backend.api.notification;

import com.tallerzapata.backend.application.notification.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
@Tag(name = "Notificaciones", description = "Gestion de notificaciones del sistema")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @Operation(summary = "Listar notificaciones no leidas", description = "Devuelve las notificaciones no leidas del usuario actual")
    @ApiResponse(responseCode = "200", description = "OK")
    @GetMapping("/unread")
    public List<NotificationResponse> listUnreadNotifications() {
        return notificationService.listUnreadNotifications();
    }

    @Operation(summary = "Listar todas las notificaciones", description = "Devuelve todas las notificaciones del usuario actual")
    @ApiResponse(responseCode = "200", description = "OK")
    @GetMapping
    public List<NotificationResponse> listAllNotifications() {
        return notificationService.listAllNotifications();
    }

    @Operation(summary = "Contar notificaciones no leidas", description = "Devuelve la cantidad de notificaciones no leidas del usuario actual")
    @ApiResponse(responseCode = "200", description = "OK")
    @GetMapping("/count-unread")
    public long countUnreadNotifications() {
        return notificationService.countUnreadNotifications();
    }

    @Operation(summary = "Marcar notificacion como leida", description = "Marca una notificacion especifica como leida")
    @ApiResponse(responseCode = "200", description = "OK")
    @PutMapping("/{notificationId}/read")
    public NotificationResponse markAsRead(@PathVariable Long notificationId, HttpServletRequest httpRequest) {
        return notificationService.markAsRead(notificationId, httpRequest);
    }

    @Operation(summary = "Crear notificacion", description = "Crea una nueva notificacion en el sistema")
    @ApiResponse(responseCode = "200", description = "OK")
    @PostMapping
    public NotificationResponse createNotification(@RequestBody NotificationCreateRequest request, HttpServletRequest httpRequest) {
        return notificationService.createNotification(request, httpRequest);
    }
}
