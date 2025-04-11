const process = require('process');
const opentelemetry = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-proto');
const { Resource } = require('@opentelemetry/resources');
const { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION } = require('@opentelemetry/semantic-conventions');
const { deprecate } = require('util');

// l'Exporter
const traceExporter =  new OTLPTraceExporter({url: "https://0218-142-137-160-192.ngrok-free.app/v1/traces"})

const sdk = new opentelemetry.NodeSDK({
    resource: new Resource({
      [SEMRESATTRS_SERVICE_NAME]: 'order',
      [SEMRESATTRS_SERVICE_VERSION]: '1.0.0',
    }),
    traceExporter,
    instrumentations: [getNodeAutoInstrumentations()]
});

sdk.start()


process.on('SIGTERM', () => {
    sdk.shutdown()
      .then(() => console.log('Tracing terminated'))
      .catch((error) => console.log('Error terminating tracing', error))
      .finally(() => process.exit(0));
  });



  