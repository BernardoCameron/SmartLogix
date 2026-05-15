package com.smartlogix.shipment.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE_NAME = "order.exchange";
    public static final String QUEUE_NAME = "shipment.request.queue";
    public static final String ROUTING_KEY = "order.shipment.request.key";

    @Bean
    public DirectExchange orderExchange() {
        return new DirectExchange(EXCHANGE_NAME);
    }

    @Bean
    public Queue shipmentRequestQueue() {
        return new Queue(QUEUE_NAME, true);
    }

    @Bean
    public Binding bindingShipmentRequest(Queue shipmentRequestQueue, DirectExchange orderExchange) {
        return BindingBuilder.bind(shipmentRequestQueue).to(orderExchange).with(ROUTING_KEY);
    }

    @Bean
    public Jackson2JsonMessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
