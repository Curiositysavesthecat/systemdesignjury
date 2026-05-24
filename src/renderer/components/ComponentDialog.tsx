import { useState } from 'react';
import './ComponentDialog.css';

export interface ComponentVariant {
  value: string;
  label: string;
}

export const COMPONENT_VARIANTS: Record<string, ComponentVariant[]> = {
  service: [
    { value: 'rest-api', label: 'REST API Service' },
    { value: 'grpc', label: 'gRPC Service' },
    { value: 'graphql', label: 'GraphQL Service' },
    { value: 'websocket', label: 'WebSocket Service' },
    { value: 'worker', label: 'Background Worker' },
    { value: 'cron', label: 'Cron/Scheduled Job' },
    { value: 'serverless', label: 'Serverless Function' },
  ],
  database: [
    { value: 'postgresql', label: 'PostgreSQL' },
    { value: 'mysql', label: 'MySQL' },
    { value: 'cassandra', label: 'Cassandra' },
    { value: 'mongodb', label: 'MongoDB' },
    { value: 'dynamodb', label: 'DynamoDB' },
    { value: 'elasticsearch', label: 'Elasticsearch' },
    { value: 'neo4j', label: 'Neo4j (Graph)' },
    { value: 'cockroachdb', label: 'CockroachDB' },
    { value: 'sqlite', label: 'SQLite' },
  ],
  cache: [
    { value: 'redis', label: 'Redis' },
    { value: 'memcached', label: 'Memcached' },
    { value: 'redis-cluster', label: 'Redis Cluster' },
    { value: 'local-cache', label: 'Local/In-Memory Cache' },
    { value: 'cdn-cache', label: 'CDN Edge Cache' },
  ],
  queue: [
    { value: 'kafka', label: 'Apache Kafka' },
    { value: 'rabbitmq', label: 'RabbitMQ' },
    { value: 'sqs', label: 'AWS SQS' },
    { value: 'nats', label: 'NATS' },
    { value: 'pulsar', label: 'Apache Pulsar' },
    { value: 'redis-streams', label: 'Redis Streams' },
    { value: 'kinesis', label: 'AWS Kinesis' },
  ],
  loadbalancer: [
    { value: 'nginx', label: 'Nginx' },
    { value: 'haproxy', label: 'HAProxy' },
    { value: 'alb', label: 'AWS ALB' },
    { value: 'envoy', label: 'Envoy' },
    { value: 'traefik', label: 'Traefik' },
    { value: 'cloudflare', label: 'Cloudflare' },
  ],
  cdn: [
    { value: 'cloudflare', label: 'Cloudflare' },
    { value: 'cloudfront', label: 'AWS CloudFront' },
    { value: 'akamai', label: 'Akamai' },
    { value: 'fastly', label: 'Fastly' },
    { value: 'gcp-cdn', label: 'Google Cloud CDN' },
  ],
  gateway: [
    { value: 'kong', label: 'Kong' },
    { value: 'aws-apigw', label: 'AWS API Gateway' },
    { value: 'nginx', label: 'Nginx (as gateway)' },
    { value: 'envoy', label: 'Envoy' },
    { value: 'zuul', label: 'Netflix Zuul' },
    { value: 'apigee', label: 'Apigee' },
  ],
  client: [
    { value: 'web-spa', label: 'Web SPA (React/Vue/Angular)' },
    { value: 'web-ssr', label: 'Web SSR (Next.js/Nuxt)' },
    { value: 'mobile-ios', label: 'iOS App' },
    { value: 'mobile-android', label: 'Android App' },
    { value: 'mobile-rn', label: 'React Native' },
    { value: 'desktop', label: 'Desktop App' },
    { value: 'cli', label: 'CLI Client' },
  ],
  storage: [
    { value: 's3', label: 'AWS S3' },
    { value: 'gcs', label: 'Google Cloud Storage' },
    { value: 'azure-blob', label: 'Azure Blob Storage' },
    { value: 'hdfs', label: 'HDFS' },
    { value: 'minio', label: 'MinIO' },
    { value: 'nfs', label: 'NFS/File System' },
  ],
  dns: [
    { value: 'route53', label: 'AWS Route 53' },
    { value: 'cloudflare-dns', label: 'Cloudflare DNS' },
    { value: 'gcp-dns', label: 'Google Cloud DNS' },
    { value: 'custom', label: 'Custom DNS' },
  ],
  search: [
    { value: 'elasticsearch', label: 'Elasticsearch' },
    { value: 'solr', label: 'Apache Solr' },
    { value: 'meilisearch', label: 'Meilisearch' },
    { value: 'algolia', label: 'Algolia' },
    { value: 'typesense', label: 'Typesense' },
    { value: 'opensearch', label: 'OpenSearch' },
  ],
  notification: [
    { value: 'fcm-apns', label: 'FCM / APNS (Push)' },
    { value: 'twilio', label: 'Twilio (SMS)' },
    { value: 'sendgrid', label: 'SendGrid (Email)' },
    { value: 'sns', label: 'AWS SNS' },
    { value: 'webhook', label: 'Webhook' },
    { value: 'onesignal', label: 'OneSignal' },
  ],
  streaming: [
    { value: 'websocket', label: 'WebSocket Server' },
    { value: 'sse', label: 'Server-Sent Events (SSE)' },
    { value: 'mqtt', label: 'MQTT Broker' },
    { value: 'media-sfu', label: 'Media Server (SFU)' },
    { value: 'grpc-stream', label: 'gRPC Stream' },
    { value: 'webrtc', label: 'WebRTC' },
  ],
  pipeline: [
    { value: 'transcoding', label: 'Transcoding Pipeline' },
    { value: 'etl', label: 'ETL Pipeline' },
    { value: 'image-processing', label: 'Image Processing' },
    { value: 'data-ingestion', label: 'Data Ingestion' },
    { value: 'ml-inference', label: 'ML Inference Pipeline' },
    { value: 'stream-processing', label: 'Stream Processing (Flink/Spark)' },
  ],
  scheduler: [
    { value: 'cron', label: 'Cron Job' },
    { value: 'airflow', label: 'Apache Airflow' },
    { value: 'temporal', label: 'Temporal' },
    { value: 'step-functions', label: 'AWS Step Functions' },
    { value: 'celery', label: 'Celery Beat' },
    { value: 'quartz', label: 'Quartz Scheduler' },
  ],
  monitoring: [
    { value: 'prometheus', label: 'Prometheus' },
    { value: 'datadog', label: 'Datadog' },
    { value: 'grafana', label: 'Grafana' },
    { value: 'elk', label: 'ELK Stack' },
    { value: 'cloudwatch', label: 'AWS CloudWatch' },
    { value: 'newrelic', label: 'New Relic' },
  ],
};

const DEFAULT_VARIANTS: Record<string, string> = {
  service: 'rest-api',
  database: 'postgresql',
  cache: 'redis',
  queue: 'kafka',
  loadbalancer: 'nginx',
  cdn: 'cloudflare',
  gateway: 'kong',
  client: 'web-spa',
  storage: 's3',
  dns: 'route53',
  search: 'elasticsearch',
  notification: 'fcm-apns',
  streaming: 'websocket',
  pipeline: 'etl',
  scheduler: 'cron',
  monitoring: 'prometheus',
};

interface ComponentDialogProps {
  componentType: string;
  componentLabel: string;
  initialVariant?: string;
  initialDescription?: string;
  isEdit?: boolean;
  onConfirm: (variant: string, description: string, label: string) => void;
  onCancel: () => void;
  onOpenWizard?: () => void;
}

export function ComponentDialog({ componentType, componentLabel, initialVariant, initialDescription, isEdit, onConfirm, onCancel, onOpenWizard }: ComponentDialogProps) {
  const variants = COMPONENT_VARIANTS[componentType] || [];
  const defaultVariant = DEFAULT_VARIANTS[componentType] || '';
  const [variant, setVariant] = useState(initialVariant || defaultVariant);
  const [description, setDescription] = useState(initialDescription || '');
  const [label, setLabel] = useState(componentLabel);

  const handleConfirm = () => {
    onConfirm(variant || defaultVariant, description, label || componentLabel);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleConfirm();
    }
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  const selectedVariantLabel = variants.find((v) => v.value === variant)?.label || '';

  return (
    <div className="component-dialog__overlay" onClick={onCancel}>
      <div
        className="component-dialog"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <h3 className="component-dialog__title">
          {isEdit ? 'edit' : 'configure'} {componentLabel.toLowerCase()}
        </h3>

        <div className="component-dialog__field">
          <label className="component-dialog__label">label</label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={componentLabel}
            className="component-dialog__input"
            autoFocus
          />
        </div>

        {variants.length > 0 && (
          <div className="component-dialog__field">
            <label className="component-dialog__label">variant</label>
            <select
              value={variant}
              onChange={(e) => setVariant(e.target.value)}
              className="component-dialog__select"
            >
              {variants.map((v) => (
                <option key={v.value} value={v.value}>{v.label}</option>
              ))}
            </select>
          </div>
        )}

        <div className="component-dialog__field component-dialog__field--last">
          <label className="component-dialog__label">
            reason <span className="component-dialog__label-optional">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={`why ${selectedVariantLabel || componentLabel.toLowerCase()}?`}
            className="component-dialog__textarea"
          />
        </div>

        <div className="component-dialog__actions">
          {isEdit && componentType === 'database' && onOpenWizard && (
            <button onClick={onOpenWizard} className="component-dialog__wizard-btn component-dialog__wizard-btn--database">
              schema wizard →
            </button>
          )}
          {isEdit && componentType === 'service' && onOpenWizard && (
            <button onClick={onOpenWizard} className="component-dialog__wizard-btn component-dialog__wizard-btn--api">
              api wizard →
            </button>
          )}
          <button onClick={onCancel} className="component-dialog__cancel-btn">
            {isEdit ? 'cancel' : 'skip'}
          </button>
          <button onClick={handleConfirm} className="component-dialog__confirm-btn">
            {isEdit ? 'save' : 'add'}
          </button>
        </div>
      </div>
    </div>
  );
}
