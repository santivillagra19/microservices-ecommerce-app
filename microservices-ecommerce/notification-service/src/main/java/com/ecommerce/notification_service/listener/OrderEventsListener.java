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
        message.setSubject("¡Tu pedido " + event.orderNumber() + " ha sido confirmado!");
        message.setText("Hola,\n\n" +
                "¡Tenemos excelentes noticias! Tu pedido con número " + event.orderNumber() + " ha sido procesado exitosamente y ya lo estamos preparando.\n\n" +
                "Pronto te enviaremos otra actualización en cuanto tu paquete esté en camino.\n\n" +
                "¡Gracias por elegirnos!\n\n" +
                "Saludos cordiales,\n" +
                "El equipo de E-Commerce");

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
        message.setSubject("Aviso importante: Tu pedido " + event.orderNumber() + " ha sido cancelado");
        message.setText("Hola,\n\n" +
                "Lamentamos informarte que tu pedido con número " + event.orderNumber() + " ha tenido que ser cancelado.\n\n" +
                "Motivo de la cancelación: " + event.reason() + "\n\n" +
                "Si ya realizaste algún pago, no te preocupes, el reembolso será procesado en los próximos días hábiles.\n\n" +
                "Si tienes alguna duda, por favor responde a este correo para que nuestro equipo de soporte te asista.\n\n" +
                "Atentamente,\n" +
                "El equipo de E-Commerce");

        mailSender.send(message);

        log.info("Correo enviado exitosamente para la orden: {}", event.orderNumber());
    }

    @RabbitListener(queues = "notification-placed-queue")
    public void handleOrderPlacedEvent(com.ecommerce.notification_service.event.OrderPlacedEvent event) {
        log.info("Pedido recibido para la Orden: {}", event.orderNumber());

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("pedidos@ecommerce.com");
        message.setTo(event.email());
        message.setSubject("Hemos recibido tu pedido: " + event.orderNumber());
        message.setText("Hola,\n\n" +
                "¡Gracias por tu compra! Hemos recibido tu pedido con número " + event.orderNumber() + " y actualmente se encuentra en estado de verificación de stock y pago.\n\n" +
                "Te enviaremos una notificación cuando sea confirmado.\n\n" +
                "Atentamente,\n" +
                "El equipo de E-Commerce");

        mailSender.send(message);

        log.info("Correo enviado exitosamente para la orden recibida (placed): {}", event.orderNumber());
    }

}
