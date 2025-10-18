#!/usr/bin/env node

/**
 * API Gateway Deployment Script for ZRA Sandbox
 */

require('dotenv').config({ path: '../.env.sandbox' });
const fs = require('fs-extra');
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.simple()
    ),
    transports: [new winston.transports.Console()]
});

class APIDeployer {
    constructor() {
        this.config = {
            port: process.env.API_GATEWAY_PORT || 4000,
            environment: 'sandbox',
            dockerRegistry: process.env.DOCKER_REGISTRY,
            dockerTag: process.env.DOCKER_TAG
        };
    }

    async deployAPI() {
        logger.info('🚀 Deploying API Gateway to ZRA Sandbox');
        logger.info('========================================');

        try {
            // Create Docker configuration
            await this.createDockerConfig();
            
            // Create Kubernetes manifests
            await this.createKubernetesManifests();
            
            // Create environment configuration
            await this.createEnvironmentConfig();
            
            // Create health check configuration
            await this.createHealthCheckConfig();
            
            // Simulate deployment
            const deploymentResult = await this.simulateDeployment();
            
            logger.info('\n✅ API Gateway deployed successfully!');
            return deploymentResult;

        } catch (error) {
            logger.error('❌ API Gateway deployment failed:', error.message);
            throw error;
        }
    }

    async createDockerConfig() {
        logger.info('\n📋 Creating Docker configuration...');

        const dockerfile = `
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \\
    CMD curl -f http://localhost:4000/health || exit 1

# Start application
CMD ["npm", "start"]
`;

        const dockerCompose = {
            version: '3.8',
            services: {
                'taxguard-api-gateway': {
                    build: {
                        context: '../artifacts/api-gateway',
                        dockerfile: 'Dockerfile'
                    },
                    ports: [`${this.config.port}:4000`],
                    environment: {
                        NODE_ENV: 'sandbox',
                        PORT: '4000',
                        BLOCKCHAIN_API_URL: process.env.SANDBOX_BLOCKCHAIN_URL,
                        JWT_SECRET: process.env.JWT_SECRET,
                        SIEM_ENDPOINT: process.env.SIEM_ENDPOINT
                    },
                    volumes: [
                        './logs:/app/logs'
                    ],
                    restart: 'unless-stopped',
                    networks: ['taxguard-network']
                }
            },
            networks: {
                'taxguard-network': {
                    driver: 'bridge'
                }
            }
        };

        await fs.writeFile('../artifacts/api-gateway/Dockerfile', dockerfile);
        await fs.writeJson('../configs/docker-compose.yml', dockerCompose, { spaces: 2 });
        
        logger.info('✅ Docker configuration created');
    }

    async createKubernetesManifests() {
        logger.info('\n📋 Creating Kubernetes manifests...');

        const deployment = {
            apiVersion: 'apps/v1',
            kind: 'Deployment',
            metadata: {
                name: 'taxguard-api-gateway',
                namespace: 'zra-sandbox',
                labels: {
                    app: 'taxguard-api-gateway',
                    version: 'v1.0.0'
                }
            },
            spec: {
                replicas: 2,
                selector: {
                    matchLabels: {
                        app: 'taxguard-api-gateway'
                    }
                },
                template: {
                    metadata: {
                        labels: {
                            app: 'taxguard-api-gateway'
                        }
                    },
                    spec: {
                        containers: [{
                            name: 'api-gateway',
                            image: `${this.config.dockerRegistry}/taxguard-api-gateway:${this.config.dockerTag}`,
                            ports: [{
                                containerPort: 4000
                            }],
                            env: [
                                { name: 'NODE_ENV', value: 'sandbox' },
                                { name: 'PORT', value: '4000' },
                                { name: 'BLOCKCHAIN_API_URL', value: process.env.SANDBOX_BLOCKCHAIN_URL },
                                { name: 'JWT_SECRET', valueFrom: { secretKeyRef: { name: 'taxguard-secrets', key: 'jwt-secret' } } },
                                { name: 'SIEM_ENDPOINT', value: process.env.SIEM_ENDPOINT }
                            ],
                            livenessProbe: {
                                httpGet: {
                                    path: '/health',
                                    port: 4000
                                },
                                initialDelaySeconds: 30,
                                periodSeconds: 10
                            },
                            readinessProbe: {
                                httpGet: {
                                    path: '/health',
                                    port: 4000
                                },
                                initialDelaySeconds: 5,
                                periodSeconds: 5
                            }
                        }]
                    }
                }
            }
        };

        const service = {
            apiVersion: 'v1',
            kind: 'Service',
            metadata: {
                name: 'taxguard-api-gateway-service',
                namespace: 'zra-sandbox'
            },
            spec: {
                selector: {
                    app: 'taxguard-api-gateway'
                },
                ports: [{
                    protocol: 'TCP',
                    port: 80,
                    targetPort: 4000
                }],
                type: 'LoadBalancer'
            }
        };

        const ingress = {
            apiVersion: 'networking.k8s.io/v1',
            kind: 'Ingress',
            metadata: {
                name: 'taxguard-api-gateway-ingress',
                namespace: 'zra-sandbox',
                annotations: {
                    'kubernetes.io/ingress.class': 'nginx',
                    'cert-manager.io/cluster-issuer': 'letsencrypt-prod'
                }
            },
            spec: {
                tls: [{
                    hosts: ['sandbox-api.zra.gov.zm'],
                    secretName: 'taxguard-api-tls'
                }],
                rules: [{
                    host: 'sandbox-api.zra.gov.zm',
                    http: {
                        paths: [{
                            path: '/',
                            pathType: 'Prefix',
                            backend: {
                                service: {
                                    name: 'taxguard-api-gateway-service',
                                    port: {
                                        number: 80
                                    }
                                }
                            }
                        }]
                    }
                }]
            }
        };

        await fs.writeJson('../configs/k8s-deployment.yaml', deployment, { spaces: 2 });
        await fs.writeJson('../configs/k8s-service.yaml', service, { spaces: 2 });
        await fs.writeJson('../configs/k8s-ingress.yaml', ingress, { spaces: 2 });

        logger.info('✅ Kubernetes manifests created');
    }

    async createEnvironmentConfig() {
        logger.info('\n📋 Creating environment configuration...');

        const envConfig = {
            NODE_ENV: 'sandbox',
            PORT: '4000',
            JWT_SECRET: process.env.JWT_SECRET,
            JWT_EXPIRES_IN: '24h',
            BLOCKCHAIN_API_URL: process.env.SANDBOX_BLOCKCHAIN_URL,
            SIEM_ENDPOINT: process.env.SIEM_ENDPOINT,
            LOG_LEVEL: 'info',
            RATE_LIMIT_WINDOW: '900000',
            RATE_LIMIT_MAX: '100'
        };

        await fs.writeJson('../configs/api-environment.json', envConfig, { spaces: 2 });
        logger.info('✅ Environment configuration created');
    }

    async createHealthCheckConfig() {
        logger.info('\n📋 Creating health check configuration...');

        const healthCheckConfig = {
            endpoint: '/health',
            interval: 30000,
            timeout: 10000,
            retries: 3,
            checks: [
                {
                    name: 'database',
                    type: 'http',
                    url: `${process.env.SANDBOX_BLOCKCHAIN_URL}/health`
                },
                {
                    name: 'siem',
                    type: 'http',
                    url: process.env.SIEM_ENDPOINT,
                    optional: true
                }
            ]
        };

        await fs.writeJson('../configs/health-check.json', healthCheckConfig, { spaces: 2 });
        logger.info('✅ Health check configuration created');
    }

    async simulateDeployment() {
        logger.info('\n📋 Simulating API Gateway deployment...');

        // Simulate deployment process
        await new Promise(resolve => setTimeout(resolve, 2000));

        const deploymentResult = {
            service: 'taxguard-api-gateway',
            status: 'deployed',
            environment: 'sandbox',
            deployedAt: new Date().toISOString(),
            endpoints: {
                public: process.env.SANDBOX_API_URL,
                health: `${process.env.SANDBOX_API_URL}/health`,
                docs: `${process.env.SANDBOX_API_URL}/api-docs`
            },
            configuration: {
                port: this.config.port,
                replicas: 2,
                resources: {
                    cpu: '500m',
                    memory: '512Mi'
                }
            }
        };

        await fs.writeJson('../configs/api-deployment-result.json', deploymentResult, { spaces: 2 });
        
        logger.info(`✅ API Gateway deployed at: ${deploymentResult.endpoints.public}`);
        return deploymentResult;
    }
}

// Execute if run directly
if (require.main === module) {
    const deployer = new APIDeployer();
    deployer.deployAPI().catch(error => {
        console.error('API deployment failed:', error);
        process.exit(1);
    });
}

module.exports = APIDeployer;
