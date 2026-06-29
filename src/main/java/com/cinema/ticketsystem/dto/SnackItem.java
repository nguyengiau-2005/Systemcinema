package com.cinema.ticketsystem.dto;

public record SnackItem(Long id, String name, String type, Double price, Integer stockQuantity, Integer alertThreshold) { }
