package com.ecommerce.notification_service.config;

import org.springframework.amqp.core.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;

@Configuration
public class RabbitMQConfig {

    @Bean
    public MessageConverter messageConverter(){
        return new JacksonJsonMessageConverter();
    }

    @Bean
    public Queue notificationConfirmedQueue(){
        return QueueBuilder.durable("notification-confirmed-queue")
                .withArgument("x-dead-letter-exchange", "notification-dlx")
                .withArgument("x-dead-letter-routing-key", "notification.dead")
                .build();
    }

    @Bean
    public Queue notificationCancelledQueue(){
        return QueueBuilder.durable("notification-cancelled-queue")
                .withArgument("x-dead-letter-exchange", "notification-dlx")
                .withArgument("x-dead-letter-routing-key", "notification.dead")
                .build();
    }

    @Bean
    public TopicExchange orderEventsExchange(){
        return new TopicExchange("order-events");
    }

    @Bean
    public Binding confirmedBinding(Queue notificationConfirmedQueue, TopicExchange orderEventsExchange){
        return BindingBuilder.bind(notificationConfirmedQueue).to(orderEventsExchange).with("order.confirmed");
    }

    @Bean
    public Binding cancelledBinding(Queue notificationCancelledQueue, TopicExchange orderEventsExchange){
        return BindingBuilder.bind(notificationCancelledQueue).to(orderEventsExchange).with("order.cancelled");
    }

    @Bean
    public DirectExchange deadLetterExchange(){
        return new DirectExchange("notification-dlx");
    }

    @Bean
    public Queue deadLetterQueue(){
        return QueueBuilder.durable("notification-deadLetter-queue").build();
    }

    @Bean
    public Binding deadLetterBinding(Queue deadLetterQueue, DirectExchange deadLetterExchange){
        return BindingBuilder.bind(deadLetterQueue).to(deadLetterExchange).with("notification.dead");
    }

}

