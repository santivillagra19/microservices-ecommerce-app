package com.ecommerce.order_service.exception;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class GlobalControllerAdviceTest {

    @Test
    void paymentUnavailable_ShouldPreserveHttpStatusAndMessage() throws Exception {
        MockMvcBuilders.standaloneSetup(new PaymentFailureController())
                .setControllerAdvice(new GlobalControllerAdvice())
                .build()
                .perform(get("/payment-failure"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.detail").value("No se pudo iniciar el pago con Mercado Pago."));
    }

    @RestController
    static class PaymentFailureController {
        @GetMapping("/payment-failure")
        void fail() {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "No se pudo iniciar el pago con Mercado Pago.");
        }
    }
}
