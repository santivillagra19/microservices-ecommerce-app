package com.ecommerce.payment_service.config;

import ch.qos.logback.classic.pattern.ClassicConverter;
import ch.qos.logback.classic.spi.ILoggingEvent;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class MaskingMessageConverter extends ClassicConverter {

    // Matches credit card numbers (13 to 19 digits with optional spaces or hyphens)
    private static final Pattern CARD_PAN_PATTERN =
            Pattern.compile("\\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\\d{3})\\d{11}|\\d{13,19})\\b");

    // Matches CVV/CVC keywords and their values (supports whitespace, underscore, or hyphen)
    private static final Pattern CVV_PATTERN =
            Pattern.compile("(?i)(cvv|cvc|security[\\s_-]?code|verification[\\s_-]?value)[\"':\\s=]+([0-9]{3,4})");

    // Matches expiration keywords and dates (supports whitespace, underscore, or hyphen)
    private static final Pattern EXPIRY_PATTERN =
            Pattern.compile("(?i)((?:expiry|expiration|exp)(?:[\\s_-]+(?:month|year|date))?)[\"':\\s=]+([0-9]{2,4}[/-]?[0-9]{2,4})");

    // Matches one-time card tokens
    private static final Pattern TOKEN_PATTERN =
            Pattern.compile("(?i)(token)[\"':\\s=]+([a-zA-Z0-9_\\-]{16,})");

    // Matches MercadoPago access tokens
    private static final Pattern ACCESS_TOKEN_PATTERN =
            Pattern.compile("(TEST|APP_USR)-[0-9a-zA-Z]{10,}-[0-9]{6,}-[a-zA-Z0-9]{10,}");

    // Matches Bearer authorization tokens
    private static final Pattern BEARER_PATTERN =
            Pattern.compile("(?i)Bearer\\s+([A-Za-z0-9\\-._~+/]+=*)");

    @Override
    public String convert(ILoggingEvent event) {
        String message = event.getFormattedMessage();
        if (message == null || message.isEmpty()) {
            return message;
        }

        try {
            // 1. Mask Bearer authorization tokens
            message = BEARER_PATTERN.matcher(message).replaceAll("Bearer [PROTECTED]");

            // 2. Mask MercadoPago Access Tokens
            message = ACCESS_TOKEN_PATTERN.matcher(message).replaceAll("$1-****-PROTECTED");

            // 3. Mask CVV
            message = CVV_PATTERN.matcher(message).replaceAll("$1=***");

            // 4. Mask Expiry
            message = EXPIRY_PATTERN.matcher(message).replaceAll("$1=**/**");

            // 5. Mask Card PAN (retain last 4 digits)
            Matcher panMatcher = CARD_PAN_PATTERN.matcher(message);
            StringBuilder sb = new StringBuilder();
            while (panMatcher.find()) {
                String pan = panMatcher.group();
                String cleanDigits = pan.replaceAll("[ -]", "");
                if (cleanDigits.length() >= 13 && cleanDigits.length() <= 19) {
                    String masked = "************" + cleanDigits.substring(cleanDigits.length() - 4);
                    panMatcher.appendReplacement(sb, Matcher.quoteReplacement(masked));
                } else {
                    panMatcher.appendReplacement(sb, Matcher.quoteReplacement(pan));
                }
            }
            panMatcher.appendTail(sb);
            message = sb.toString();

            // 6. Mask One-Time Card Tokens (retain first 4 and last 4)
            Matcher tokenMatcher = TOKEN_PATTERN.matcher(message);
            StringBuilder tokenSb = new StringBuilder();
            while (tokenMatcher.find()) {
                String prefix = tokenMatcher.group(1);
                String tokenVal = tokenMatcher.group(2);
                if (tokenVal.length() >= 8) {
                    String maskedToken = tokenVal.substring(0, 4) + "****" + tokenVal.substring(tokenVal.length() - 4);
                    tokenMatcher.appendReplacement(tokenSb, prefix + "=" + maskedToken);
                } else {
                    tokenMatcher.appendReplacement(tokenSb, prefix + "=****");
                }
            }
            tokenMatcher.appendTail(tokenSb);
            message = tokenSb.toString();

        } catch (Exception ignored) {
            // In case of parsing error, return original message without crashing log pipeline
        }

        return message;
    }
}
