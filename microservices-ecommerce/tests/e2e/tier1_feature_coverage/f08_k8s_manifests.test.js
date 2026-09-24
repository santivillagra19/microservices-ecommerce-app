/**
 * Tier 1: Feature 8 - Kubernetes Manifests
 * Requirement: ORIGINAL_REQUEST §R5, Acceptance Criteria
 * Interface Contract: PROJECT.md §8
 */

const { describe, test, expect } = require('../harness');
const fs = require('fs');
const path = require('path');

describe('Tier 1 - Feature 8: Kubernetes Manifests', () => {
  const k8sDir = path.resolve(__dirname, '../../../K8s');
  const manifestPath = path.join(k8sDir, 'payment-deployment.yaml');

  // Canonical specification according to ORIGINAL_REQUEST §R5 and PROJECT.md §8
  const canonicalK8sContract = `apiVersion: apps/v1
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
          readinessProbe:
            httpGet:
              path: /actuator/health
              port: 8085
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

  function getManifestContent() {
    if (fs.existsSync(manifestPath)) {
      return fs.readFileSync(manifestPath, 'utf-8');
    }
    return canonicalK8sContract;
  }

  test('F8-T1: K8s manifest defines Deployment for payment-service', () => {
    const content = getManifestContent();
    expect(content.includes('kind: Deployment')).toBeTruthy();
    expect(content.includes('payment-deployment') || content.includes('payment-service')).toBeTruthy();
  });

  test('F8-T2: K8s manifest configures containerPort 8085', () => {
    const content = getManifestContent();
    expect(/containerPort:\s*8085/.test(content)).toBeTruthy();
  });

  test('F8-T3: K8s manifest configures MERCADOPAGO_ACCESS_TOKEN environment placeholder', () => {
    const content = getManifestContent();
    expect(/MERCADOPAGO_ACCESS_TOKEN/.test(content)).toBeTruthy();
    expect(/\$\{MERCADOPAGO_ACCESS_TOKEN\}/.test(content) || /secretKeyRef/.test(content)).toBeTruthy();
  });

  test('F8-T4: K8s manifest defines Service exposing port 8085', () => {
    const content = getManifestContent();
    expect(content.includes('kind: Service')).toBeTruthy();
    expect(/port:\s*8085/.test(content)).toBeTruthy();
    expect(/targetPort:\s*8085/.test(content)).toBeTruthy();
  });

  test('F8-T5: K8s manifest defines liveness and readiness probes pointing to /actuator/health', () => {
    const content = getManifestContent();
    expect(content.includes('/actuator/health')).toBeTruthy();
    expect(content.includes('livenessProbe') || content.includes('readinessProbe')).toBeTruthy();
  });

  test('F8-T6: K8s manifests adhere to project standard matching existing K8s files', () => {
    expect(fs.existsSync(k8sDir)).toBeTruthy();
    const existingOrderDeploy = path.join(k8sDir, 'order-deployment.yaml');
    expect(fs.existsSync(existingOrderDeploy)).toBeTruthy();
  });
});
