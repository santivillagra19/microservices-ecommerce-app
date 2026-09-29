package com.ecommerce.order_service.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrderRequestDTO {
    @NotEmpty(message = "La orden debe contener al menos un item")
    @Valid
    private List<OrderLineItemsRequestDTO> orderLineItemsList;

    @NotBlank(message = "El email es requerido")
    @Email(message = "El formato del email no es vÃ¡lido")
    private String email;

    @NotBlank(message = "El nombre es requerido")
    private String nombre;

    @NotBlank(message = "El telefono es requerido")
    private String telefono;

    @NotBlank(message = "La direccion de entrega es requerida")
    private String direccionEntrega;

    private String paymentMethod;
}
