package com.tallerzapata.backend.infrastructure.persistence.operation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface HolidayRepository extends JpaRepository<HolidayEntity, Long> {
    List<HolidayEntity> findByDateBetween(LocalDate start, LocalDate end);
}
