package com.tallerzapata.backend.application.common;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class BusinessDayCalculatorTest {

    private final BusinessDayCalculator calculator = new BusinessDayCalculator();

    @Test
    void shouldAddOneBusinessDayFromMonday() {
        LocalDate startDate = LocalDate.of(2026, 4, 20); // Lunes
        LocalDate result = calculator.addBusinessDays(startDate, 1, List.of());
        assertEquals(LocalDate.of(2026, 4, 21), result); // Martes
    }

    @Test
    void shouldSkipWeekendFromFriday() {
        LocalDate startDate = LocalDate.of(2026, 4, 24); // Viernes
        LocalDate result = calculator.addBusinessDays(startDate, 1, List.of());
        assertEquals(LocalDate.of(2026, 4, 27), result); // Lunes
    }

    @Test
    void shouldSkipHolidayAndWeekend() {
        LocalDate startDate = LocalDate.of(2026, 4, 22); // Miercoles
        LocalDate holiday = LocalDate.of(2026, 4, 23); // Jueves feriado
        LocalDate result = calculator.addBusinessDays(startDate, 3, List.of(holiday));
        assertEquals(LocalDate.of(2026, 4, 28), result); // Martes (salta Jueves feriado, Viernes, finde)
    }

    @Test
    void shouldSkipStartingHolidayAndWeekend() {
        LocalDate startDate = LocalDate.of(2026, 1, 1); // Jueves feriado
        LocalDate holiday = LocalDate.of(2026, 1, 1);
        LocalDate result = calculator.addBusinessDays(startDate, 1, List.of(holiday));
        assertEquals(LocalDate.of(2026, 1, 2), result); // Viernes (el feriado de inicio no se cuenta, siguiente dia habil)
    }

    @Test
    void shouldReturnSameDateWhenDaysIsZero() {
        LocalDate startDate = LocalDate.of(2026, 4, 20);
        LocalDate result = calculator.addBusinessDays(startDate, 0, List.of());
        assertEquals(startDate, result);
    }

    @Test
    void shouldTreatNullHolidaysAsNoHolidays() {
        LocalDate startDate = LocalDate.of(2026, 4, 20); // Lunes
        LocalDate result = calculator.addBusinessDays(startDate, 1, null);
        assertEquals(LocalDate.of(2026, 4, 21), result); // Martes
    }
}
