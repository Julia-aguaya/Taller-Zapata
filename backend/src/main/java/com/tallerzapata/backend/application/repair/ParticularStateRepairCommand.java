package com.tallerzapata.backend.application.repair;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ParticularStateRepairCommand implements ApplicationRunner {
    static final String COMMAND = "repair/recalculate-particular-states";
    private final ParticularStateRepairService repairService;

    public ParticularStateRepairCommand(ParticularStateRepairService repairService) { this.repairService = repairService; }

    @Override
    public void run(ApplicationArguments arguments) {
        if (!arguments.getNonOptionArgs().contains(COMMAND)) return;
        boolean apply = parse(arguments.getSourceArgs());
        System.out.println(repairService.repair(apply));
    }

    static boolean parse(String[] args) {
        if (args.length != 2 || !List.of(args).contains(COMMAND)) {
            throw new IllegalArgumentException("Usage: repair/recalculate-particular-states --dry-run|--apply");
        }
        return switch (args[0].equals(COMMAND) ? args[1] : args[0]) {
            case "--dry-run" -> false;
            case "--apply" -> true;
            default -> throw new IllegalArgumentException("Usage: repair/recalculate-particular-states --dry-run|--apply");
        };
    }
}
