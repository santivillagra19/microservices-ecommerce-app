package com.api_gateway.api_gateway;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.cors.reactive.CorsConfigurationSource;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import java.util.List;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
class ApiGatewayApplicationTests {

    @Autowired
    private CorsConfigurationSource corsConfigurationSource;

    @Test
    void orderTracking_ShouldAllowPrivateCapabilityHeaderFromBrowser() {
        var request = MockServerHttpRequest.options("/api/v1/order/1/tracking")
                .header("Origin", "http://localhost:5173").build();
        var cors = corsConfigurationSource.getCorsConfiguration(MockServerWebExchange.from(request));
        assertNotNull(cors);
        assertNotNull(cors.checkHeaders(List.of("X-Order-Token")));
    }

	@Test
	void contextLoads() {
	}

}
