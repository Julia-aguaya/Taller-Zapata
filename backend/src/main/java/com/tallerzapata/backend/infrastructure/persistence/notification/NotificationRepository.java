package com.tallerzapata.backend.infrastructure.persistence.notification;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<NotificationEntity, Long> {
    List<NotificationEntity> findByUserIdAndReadFalseOrderByCreatedAtDesc(Long userId);
    List<NotificationEntity> findByUserIdOrderByCreatedAtDesc(Long userId);
    long countByUserIdAndReadFalse(Long userId);
}
