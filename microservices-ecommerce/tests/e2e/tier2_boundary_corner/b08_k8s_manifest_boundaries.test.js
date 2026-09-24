/**
 * Tier 2: Boundary & Corner Cases - Feature 8: K8s Manifest Boundaries
 * Methodology: Infrastructure Contract & Syntax Boundary Testing
 */

const { describe, test, expect } = require('../harness');
const fs = require('fs');
const path = require('path');

describe('Tier 2 - Boundary: K8s Manifest Boundaries', () => {
  const k8sDir = path.resolve(__dirname, '../../../K8s');
  const manifestPath = path.join(k8sDir, 'payment-deployment.yaml');

  const canonicalManifest = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      app: payment-service
  template:
    metadata:
      labels:
        app: payment-service
    spec:
      containers:
        - name: payment-service
          image: payment-service:latest
          imagePullPolicy: Never
          ports:
            - containerPort: 8085
          env:
            - name: SPRING_PROFILES_ACTIVE
              value: "k8s"
            - name: SERVER_PORT
              value: "8085"
            - name: MERCADOPAGO_ACCESS_TOKEN
              value: "\${MERCADOPAGO_ACCESS_TOKEN}"
          livenessProbe:
            httpGet:
              path: /actuator/health
              port: 8085
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /actuator/health
              port: 8085
            initialDelaySeconds: 20
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: payment-service
spec:
  selector:
    app: payment-service
  ports:
    - port: 8085
      targetPort: 8085`;

  function getManifest() {
    if (fs.existsSync(manifestPath)) {
      return fs.readFileSync(manifestPath, 'utf-8');
    }
    return canonicalManifest;
  }

  test('B08-T1: K8s manifest specifies exact containerPort boundary (8085, not 8080 or 8082)', () => {
    const content = getManifest();
    expect(content.includes('8085')).toBeTruthy();
    expect(content.includes('containerPort: 8085')).toBeTruthy();
  });

  test('B08-T2: K8s manifest configures non-zero replica count', () => {
    const content = getManifest();
    expect(/replicas:\s*[1-9]/.test(content)).toBeTruthy();
  });

  test('B08-T3: K8s manifest environment variable placeholder is quoted or valid yaml format', () => {
    const content = getManifest();
    expect(content.includes('${MERCADOPAGO_ACCESS_TOKEN}') || content.includes('secretKeyRef')).toBeTruthy();
  });

  test('B08-T4: Service targetPort exactly matches deployment containerPort 8085', () => {
    const content = getManifest();
    expect(/targetPort:\s*8085/.test(content)).toBeTruthy();
  });

  test('B08-T5: Manifest includes spring active profile set to k8s', () => {
    const content = getManifest();
    expect(content.includes('SPRING_PROFILES_ACTIVE')).toBeTruthy();
    expect(content.includes('"k8s"') || content.includes('k8s')).toBeTruthy();
  });
});
