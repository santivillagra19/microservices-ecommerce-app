package com.ecommerce.notification_service.controller;

import com.ecommerce.notification_service.dto.ContactRequestDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.mail.javamail.MimeMessagePreparator;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.beans.factory.annotation.Value;

@RestController
@RequestMapping("/api/v1/notification")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {

    private final JavaMailSender javaMailSender;

    @Value("${spring.mail.username}")
    private String adminEmail;

    @PostMapping("/contact")
    public ResponseEntity<String> submitContactForm(@RequestBody ContactRequestDTO request) {
        log.info("Recibido formulario de contacto de: {}", request.email());

        MimeMessagePreparator messagePreparator = mimeMessage -> {
            MimeMessageHelper messageHelper = new MimeMessageHelper(mimeMessage);
            messageHelper.setFrom("ferreteria@ferreteria.com"); // Reemplazar en prod
            // Envía el correo al admin (el correo de tu SMTP o puedes hardcodear tu correo personal)
            messageHelper.setTo(adminEmail);
            
            String subject = "Nueva Consulta: " + (request.tipoConsulta() != null ? request.tipoConsulta() : "Contacto");
            messageHelper.setSubject(subject);
            
            String body = "<h1>Nueva Consulta Recibida</h1>"
                    + "<p><strong>Nombre:</strong> " + request.nombre() + "</p>"
                    + "<p><strong>Email:</strong> " + request.email() + "</p>"
                    + "<p><strong>Teléfono:</strong> " + (request.telefono() != null ? request.telefono() : "-") + "</p>"
                    + "<p><strong>Empresa:</strong> " + (request.empresa() != null ? request.empresa() : "-") + "</p>"
                    + "<p><strong>Mensaje:</strong></p>"
                    + "<p>" + request.mensaje() + "</p>";
                    
            messageHelper.setText(body, true);
        };

        try {
            javaMailSender.send(messagePreparator);
            log.info("Email de contacto enviado exitosamente a {}", adminEmail);
            return ResponseEntity.ok("Mensaje enviado correctamente.");
        } catch (MailException e) {
            log.error("Error al enviar email de contacto: {}", e.getMessage());
            // Para propósitos del frontend, si falla el mail (ej. credenciales inválidas), devolvemos 500
            return ResponseEntity.internalServerError().body("Error al enviar el mensaje.");
        }
    }
}
