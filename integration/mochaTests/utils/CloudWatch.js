const AWS = require('../node_modules/aws-sdk');
AWS.config.update({ region: 'us-east-1' });
var cloudWatch = new AWS.CloudWatch({
  apiVersion: '2010-08-01',
});

// emitMetric function is used to send metrics to CloudWatch. The metrics are sent to their respective namespaces and the namespaces are derived from the params.
// Namespace is constructured as TestType/cwNamespaceInfix/namespace/metric_name.
module.exports.emitMetric = async (
  namespace,
  capabilities,
  metric_name,
  value,
  cwNamespaceInfix
) => {
  if (process.env.CLOUD_WATCH_METRIC === undefined || process.env.CLOUD_WATCH_METRIC === 'false') {
    return;
  }
  namespace =
    cwNamespaceInfix === ''
      ? `${process.env.TEST_TYPE}/${namespace.trim()}`
      : `${process.env.TEST_TYPE}/${cwNamespaceInfix}/${namespace.trim()}`;
  metric_name = metric_name.trim();
  console.log(`Emitting metric: ${namespace}/${metric_name} : ${value}`);
  let params = {
    MetricData: [
      {
        MetricName: metric_name,
        Dimensions: [
          {
            Name: 'Browser',
            Value: capabilities.browserName,
          },
          {
            Name: 'BrowserVersion',
            Value: capabilities.version ? capabilities.version : 'default',
          },
          {
            Name: 'OS',
            Value: getOS(capabilities),
          },
          {
            Name: 'OSVersion',
            Value: getOSVersion(capabilities),
          },
          ...(isMobilePlatform(capabilities)
            ? [
                {
                  Name: 'DeviceName',
                  Value: capabilities.deviceName ? capabilities.deviceName : 'None',
                },
              ]
            : []),
        ],
        Unit: 'None',
        Value: value,
      },
    ],
    Namespace: namespace,
  };
  await publishMetricToCloudWatch(params);
  let paramsWithoutDimensions = {
    MetricData: [
      {
        MetricName: metric_name,
        Unit: 'None',
        Value: value,
      },
    ],
    Namespace: namespace,
  };
  await publishMetricToCloudWatch(paramsWithoutDimensions);
  let paramsWithBrowserDimension = {
    MetricData: [
      {
        MetricName: metric_name,
        Dimensions: [
          {
            Name: 'Browser',
            Value: capabilities.browserName,
          },
        ],
        Unit: 'None',
        Value: value,
      },
    ],
    Namespace: namespace,
  };
  await publishMetricToCloudWatch(paramsWithBrowserDimension);
  let paramsWithOSDimension = {
    MetricData: [
      {
        MetricName: metric_name,
        Dimensions: [
          {
            Name: 'OS',
            Value: getOS(capabilities),
          },
        ],
        Unit: 'None',
        Value: value,
      },
    ],
    Namespace: namespace,
  };
  await publishMetricToCloudWatch(paramsWithOSDimension);
};

const publishMetricToCloudWatch = async params => {
  try {
    await cloudWatch.putMetricData(params).promise();
  } catch (error) {
    console.log(`Unable to emit metric: ${error}`);
  }
};

const getOS = capabilities => {
  switch (capabilities.platform) {
    case 'MAC':
      return 'OS X';
    case 'WINDOWS':
      return 'windows';
    case 'LINUX':
      return 'Linux';
    case 'IOS':
      return 'iOS';
    case 'ANDROID':
      return 'Android';
    default:
      return '';
  }
};

const getOSVersion = capabilities => {
  switch (capabilities.platform) {
    case 'MAC':
      return 'Mojave';
    case 'WINDOWS':
      return '10';
    case 'LINUX':
      return 'Linux';
    case 'IOS':
      return capabilities.version ? capabilities.version : 'default';
    case 'ANDROID':
      return capabilities.version ? capabilities.version : 'default';
    default:
      return '';
  }
};

const isMobilePlatform = capabilities => {
  const os = getOS(capabilities);
  return os === 'Android' || os === 'iOS';
};
