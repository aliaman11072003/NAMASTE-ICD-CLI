# 🚀 NAMASTE-ICD Microservice Deployment Guide

**Service Type**: Healthcare Terminology Microservice  
**Deployment Options**: Standalone, Docker, Kubernetes, Cloud  

---

## 🎯 **Deployment Overview**

The NAMASTE-ICD CLI can be deployed as a microservice in multiple ways:

1. **Standalone Application** - Direct Node.js deployment
2. **Docker Container** - Containerized deployment
3. **Kubernetes** - Container orchestration
4. **Cloud Services** - AWS, Azure, GCP deployment

---

## 🏗️ **1. Standalone Deployment**

### **Prerequisites**
```bash
# Node.js 18+ and npm
node --version  # v18.0.0+
npm --version   # 8.0.0+

# MongoDB (local or cloud)
mongod --version  # 4.4.0+
```

### **Installation**
```bash
# Clone repository
git clone https://github.com/aliaman11072003/NAMASTE-ICD-CLI.git
cd NAMASTE-ICD-CLI

# Install dependencies
npm install

# Build TypeScript
npm run build

# Set environment variables
cp .env.example .env
# Edit .env with your configuration

# Start service
npm start
```

### **Environment Configuration**
```bash
# .env file
MONGODB_URI=mongodb://localhost:27017/namaste-icd
WHO_API_BASE_URL=https://id.who.int/icd
WHO_API_VERSION=v2
WHO_API_RELEASE_ID=2025-01
ICD_CLIENT_ID=your-client-id
ICD_CLIENT_SECRET=your-client-secret
ICD_TOKEN_ENDPOINT=https://icdaccessmanagement.who.int/connect/token
TOKEN_STORE=mongo
NODE_ENV=production
LOG_LEVEL=info
```

---

## 🐳 **2. Docker Deployment**

### **Dockerfile**
```dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node dist/healthcheck.js

# Start application
CMD ["npm", "start"]
```

### **Docker Compose**
```yaml
version: '3.8'

services:
  namaste-icd-microservice:
    build: .
    ports:
      - "3000:3000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/namaste-icd
      - WHO_API_BASE_URL=https://id.who.int/icd
      - WHO_API_VERSION=v2
      - WHO_API_RELEASE_ID=2025-01
      - ICD_CLIENT_ID=${ICD_CLIENT_ID}
      - ICD_CLIENT_SECRET=${ICD_CLIENT_SECRET}
      - ICD_TOKEN_ENDPOINT=https://icdaccessmanagement.who.int/connect/token
      - TOKEN_STORE=mongo
      - NODE_ENV=production
    depends_on:
      - mongo
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "dist/healthcheck.js"]
      interval: 30s
      timeout: 10s
      retries: 3

  mongo:
    image: mongo:6.0
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=password
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped

volumes:
  mongo_data:
```

### **Deployment Commands**
```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f namaste-icd-microservice

# Scale service
docker-compose up -d --scale namaste-icd-microservice=3

# Stop service
docker-compose down
```

---

## ☸️ **3. Kubernetes Deployment**

### **Namespace**
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: namaste-icd
```

### **ConfigMap**
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: namaste-icd-config
  namespace: namaste-icd
data:
  WHO_API_BASE_URL: "https://id.who.int/icd"
  WHO_API_VERSION: "v2"
  WHO_API_RELEASE_ID: "2025-01"
  ICD_TOKEN_ENDPOINT: "https://icdaccessmanagement.who.int/connect/token"
  TOKEN_STORE: "mongo"
  NODE_ENV: "production"
  LOG_LEVEL: "info"
```

### **Secret**
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: namaste-icd-secrets
  namespace: namaste-icd
type: Opaque
data:
  MONGODB_URI: <base64-encoded-mongodb-uri>
  ICD_CLIENT_ID: <base64-encoded-client-id>
  ICD_CLIENT_SECRET: <base64-encoded-client-secret>
```

### **Deployment**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: namaste-icd-microservice
  namespace: namaste-icd
spec:
  replicas: 3
  selector:
    matchLabels:
      app: namaste-icd-microservice
  template:
    metadata:
      labels:
        app: namaste-icd-microservice
    spec:
      containers:
      - name: namaste-icd
        image: namaste-icd-microservice:latest
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: namaste-icd-config
        - secretRef:
            name: namaste-icd-secrets
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### **Service**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: namaste-icd-service
  namespace: namaste-icd
spec:
  selector:
    app: namaste-icd-microservice
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: ClusterIP
```

### **Ingress**
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: namaste-icd-ingress
  namespace: namaste-icd
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - host: namaste-icd.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: namaste-icd-service
            port:
              number: 80
```

### **Deployment Commands**
```bash
# Apply configurations
kubectl apply -f namespace.yaml
kubectl apply -f configmap.yaml
kubectl apply -f secret.yaml
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f ingress.yaml

# Check deployment
kubectl get pods -n namaste-icd
kubectl get services -n namaste-icd
kubectl get ingress -n namaste-icd

# Scale deployment
kubectl scale deployment namaste-icd-microservice --replicas=5 -n namaste-icd

# View logs
kubectl logs -f deployment/namaste-icd-microservice -n namaste-icd
```

---

## ☁️ **4. Cloud Deployment**

### **AWS ECS Deployment**
```json
{
  "family": "namaste-icd-microservice",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::account:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "namaste-icd",
      "image": "your-account.dkr.ecr.region.amazonaws.com/namaste-icd:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "MONGODB_URI",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:namaste-icd/mongodb"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/namaste-icd",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### **Azure Container Instances**
```yaml
apiVersion: 2018-10-01
location: eastus
name: namaste-icd-microservice
properties:
  containers:
  - name: namaste-icd
    properties:
      image: your-registry.azurecr.io/namaste-icd:latest
      resources:
        requests:
          cpu: 1
          memoryInGb: 1
      ports:
      - port: 3000
      environmentVariables:
      - name: NODE_ENV
        value: production
      - name: MONGODB_URI
        secureValue: your-mongodb-connection-string
  osType: Linux
  ipAddress:
    type: Public
    ports:
    - protocol: tcp
      port: 3000
  restartPolicy: Always
type: Microsoft.ContainerInstance/containerGroups
```

---

## 📊 **5. Monitoring & Observability**

### **Health Check Endpoint**
```typescript
// src/healthcheck.ts
import express from 'express';
import { Database } from './db';

const app = express();

app.get('/health', async (req, res) => {
  try {
    await Database.connect();
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', error: error.message });
  }
});

app.get('/ready', async (req, res) => {
  try {
    // Check database connection
    await Database.connect();
    // Check WHO API connectivity
    // Add other readiness checks
    res.status(200).json({ status: 'ready', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({ status: 'not ready', error: error.message });
  }
});

app.listen(3000);
```

### **Prometheus Metrics**
```typescript
// src/metrics.ts
import client from 'prom-client';

const register = new client.Registry();

// Custom metrics
const apiRequestsTotal = new client.Counter({
  name: 'namaste_icd_api_requests_total',
  help: 'Total number of API requests',
  labelNames: ['method', 'endpoint', 'status']
});

const apiRequestDuration = new client.Histogram({
  name: 'namaste_icd_api_request_duration_seconds',
  help: 'API request duration in seconds',
  labelNames: ['method', 'endpoint']
});

const terminologyCodesTotal = new client.Gauge({
  name: 'namaste_icd_terminology_codes_total',
  help: 'Total number of terminology codes',
  labelNames: ['type']
});

register.registerMetric(apiRequestsTotal);
register.registerMetric(apiRequestDuration);
register.registerMetric(terminologyCodesTotal);

export { register, apiRequestsTotal, apiRequestDuration, terminologyCodesTotal };
```

---

## 🔒 **6. Security Configuration**

### **Network Security**
```yaml
# Kubernetes NetworkPolicy
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: namaste-icd-network-policy
  namespace: namaste-icd
spec:
  podSelector:
    matchLabels:
      app: namaste-icd-microservice
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 3000
  egress:
  - to: []
    ports:
    - protocol: TCP
      port: 443  # HTTPS to WHO API
    - protocol: TCP
      port: 27017  # MongoDB
```

### **RBAC Configuration**
```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: namaste-icd-sa
  namespace: namaste-icd

---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: namaste-icd
  name: namaste-icd-role
rules:
- apiGroups: [""]
  resources: ["configmaps", "secrets"]
  verbs: ["get", "list"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: namaste-icd-rolebinding
  namespace: namaste-icd
subjects:
- kind: ServiceAccount
  name: namaste-icd-sa
  namespace: namaste-icd
roleRef:
  kind: Role
  name: namaste-icd-role
  apiGroup: rbac.authorization.k8s.io
```

---

## 🎯 **7. Production Checklist**

### **Pre-Deployment** ✅
- [ ] Environment variables configured
- [ ] Secrets properly managed
- [ ] Database connection tested
- [ ] WHO API credentials validated
- [ ] Health checks implemented
- [ ] Monitoring configured
- [ ] Logging configured
- [ ] Security policies applied

### **Post-Deployment** ✅
- [ ] Service health verified
- [ ] API endpoints tested
- [ ] Database connectivity confirmed
- [ ] WHO API integration working
- [ ] Monitoring alerts configured
- [ ] Backup procedures tested
- [ ] Scaling policies configured
- [ ] Documentation updated

---

## 🎉 **Conclusion**

The NAMASTE-ICD microservice can be deployed in multiple ways:

✅ **Standalone**: Simple Node.js deployment  
✅ **Docker**: Containerized deployment with Docker Compose  
✅ **Kubernetes**: Production-grade container orchestration  
✅ **Cloud**: AWS ECS, Azure Container Instances, GCP Cloud Run  

**Choose the deployment method that best fits your infrastructure and requirements!** 🚀
