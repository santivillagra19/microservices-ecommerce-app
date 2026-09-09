package com.ecommerce.notification_service.listener;

import com.ecommerce.notification_service.event.OrderCancelledEvent;
import com.ecommerce.notification_service.event.OrderConfirmedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@RequiredArgsConstructor
public class OrderEventsListener {

    private final JavaMailSender mailSender;

    @RabbitListener(queues = "notification-confirmed-queue")
    public void handleOrderConfirmedEvent(OrderConfirmedEvent event) {
        log.info("Pedido confirmado para la Orden: {}", event.orderNumber());

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("pedidos@ecommerce.com");
        message.setTo(event.email());
        message.setSubject("Orden confirmada - " + event.orderNumber());
        message.setText("Tu pedido con número " + event.orderNumber() + " ha sido recibido correctamente \n" +
                "Pronto recibirás más noticias sobre el envío. \n\n" +
                "Gracias por comprar con nosotros!");

        mailSender.send(message);

        log.info("Correo enviado exitosamente para la orden: {}", event.orderNumber());

    }

    @RabbitListener(queues = "notification-cancelled-queue")
    public void handleOrderCancelledEvent(OrderCancelledEvent event) {
        log.info("Pedido cancelado para la Orden: {}", event.orderNumber());
        log.info("Intentando enviar correo a: {}", event.email());

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("pedidos@ecommerce.com");
        message.setTo(event.email());
        message.setSubject("Orden cancelada - " + event.orderNumber());
        message.setText("Tu pedido con número " + event.orderNumber() + " ha sido cancelado correctamente");

        mailSender.send(message);

        log.info("Correo enviado exitosamente para la orden: {}", event.orderNumber());

    }

}
