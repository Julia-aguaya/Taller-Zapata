package com.tallerzapata.backend.infrastructure.persistence.notification;

import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationTypeRepository extends JpaRepository<NotificationTypeEntity, String> {
}
