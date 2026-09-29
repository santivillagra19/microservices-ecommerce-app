package com.ecommerce.notification_service.dto;

public record ContactRequestDTO(
    String nombre,
    String email,
    String telefono,
    String empresa,
    String asunto,
    String mensaje,
    String tipoConsulta
) {}
