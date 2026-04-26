package com.tallerzapata.backend.application.common;

import org.springframework.stereotype.Component;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Component
public class BusinessDayCalculator {

    public LocalDate addBusinessDays(LocalDate startDate, int days, List<LocalDate> holidays) {
        if (days <= 0) {
            return startDate;
        }
        Set<LocalDate> holidaySet = holidays == null ? Set.of() : new HashSet<>(holidays);
        LocalDate result = startDate;
        int added = 0;
        while (added < days) {
            result = result.plusDays(1);
            if (isBusinessDay(result, holidaySet)) {
                added++;
            }
        }
        return result;
    }

    private boolean isBusinessDay(LocalDate date, Set<LocalDate> holidays) {
        DayOfWeek dow = date.getDayOfWeek();
        return dow != DayOfWeek.SATURDAY && dow != DayOfWeek.SUNDAY && !holidays.contains(date);
    }
}
