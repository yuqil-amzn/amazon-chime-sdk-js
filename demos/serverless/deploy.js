const {spawnSync} = require('child_process');
const fs = require('fs-extra');
const path = require("path");
const AWS = require('aws-sdk');
// Parameters
let region = 'us-east-1';
let useChimeSDKMeetings = true;
let bucket = ``;
let artifactBucket = ``;
let stack = ``;
let app = `meetingV2`;
let useEventBridge = false;
let enableTerminationProtection = false;
let disablePrintingLogs = false;
let chimeEndpoint = 'https://service.chime.aws.amazon.com';
let chimeSDKMeetingsEndpoint = 'https://service.chime.aws.amazon.com';
let chimeMediaPipelinesServicePrincipal = 'mediapipelines.chime.amazonaws.com'
let captureOutputPrefix = ''
let ivsChannelPrefix = ''
let mediaCaptureRegions = [
    "ap-northeast-1",
    "ap-northeast-2",
    "ap-south-1",
    "ap-southeast-1",
    "ap-southeast-2",
    "ca-central-1",
    "eu-central-1",
    "eu-north-1",
    "eu-west-1",
    "eu-west-2",
    "eu-west-3",
    "sa-east-1",
    "us-east-1",
    "us-east-2",
    "us-west-1",
    "us-west-2",
];

// Supported regions for the Amazon Chime SDK Meetings namespace
// https://docs.aws.amazon.com/chime/latest/dg/sdk-available-regions.html
const supportedControlRegions = [
    'ap-southeast-1',
    'eu-central-1',
    'us-east-1',
    'us-west-2',
    'us-gov-east-1',
    'us-gov-west-1',
];

let useChimeSDKMediaPipelines = true;
let chimeSDKMediaPipelinesEndpoint = 'https://media-pipelines-chime.us-east-1.amazonaws.com';
// Supported regions for the Amazon Chime SDK Media Pipelines namespace
// https://docs.aws.amazon.com/chime-sdk/latest/dg/sdk-available-regions.html#sdk-media-pipelines
let mediaPipelinesControlRegion = 'us-east-1';
const supportedMediaPipelinesControlRegions = [
    'ap-southeast-1',
    'eu-central-1',
    'us-east-1',
    'us-west-2',
];

AWS.config.update({region: 'us-east-1'});
const ivs = new AWS.IVS({apiVersion: '2020-07-14'});

function usage() {
    console.log(`Usage: deploy.sh [-r region] [-b bucket] [-s stack] [-a application] [-e]`);
    console.log(`  -r, --region                         Target region, default '${region}'`);
    console.log(`  -u, --use-chime-sdk-meetings         Flag to switch between chime and ChimeSDKMeetings client, default '${useChimeSDKMeetings}'`);
    console.log(`  -b, --s3-bucket                      S3 bucket for deployment, required`);
    console.log(`  -s, --stack-name                     CloudFormation stack name, required`);
    console.log(`  -a, --application                    Browser application to deploy, default '${app}'`);
    console.log(`  -e, --event-bridge                   Enable EventBridge integration, default is no integration`);
    console.log(`  -c, --chime-endpoint                 AWS SDK Chime endpoint, default is '${chimeEndpoint}'`);
    console.log(`  -p, --service-principal              Service principal for media pipelines related resources, default is '${chimeMediaPipelinesServicePrincipal}'`)
    console.log(`  -t, --enable-termination-protection  Enable termination protection for the Cloudformation stack, default is false`);
    console.log(`  -l, --disable-printing-logs          Disable printing logs`);
    console.log(`  -o, --capture-output-prefix          Prefix for S3 bucket name`);
    console.log(`  -i, --opt-in-regions                 Comma separated list of additional opt-in regions to enable for media capture`);
    console.log(`  -m, --chime-sdk-meetings-endpoint    AWS SDK Chime Meetings endpoint`);
    console.log(`  --chime-sdk-media-pipelines-region   Media pipelines control region, default '${mediaPipelinesControlRegion}'`);
    console.log(`  --chime-sdk-media-pipelines-endpoint AWS SDK Chime Media Pipelines endpoint, default is ${chimeSDKMediaPipelinesEndpoint}`)
    console.log(`  --use-chime-sdk-media-pipelines      Flag to switch between chime and chimeSDKMediaPipelines client, default '${useChimeSDKMediaPipelines}'`);
    console.log(`  --ivs-channel-prefix                 Prefix for live connector channel name`);
    console.log(`  -h, --help                           Show help and exit`);
}

function ensureBucket() {
    const s3Api = spawnSync('aws', ['s3api', 'head-bucket', '--bucket', `${bucket}`, '--region', `${region}`]);
    if (s3Api.status !== 0) {
        console.log(`Creating S3 bucket ${bucket}`);
        const s3 = spawnSync('aws', ['s3', 'mb', `s3://${bucket}`, '--region', `${region}`]);
        if (s3.status !== 0) {
            console.log(`Failed to create bucket: ${s3.status}`);
            console.log((s3.stderr || s3.stdout).toString());
            process.exit(s3.status)
        }
    }
}

function getArgOrExit(i, args) {
    if (i >= args.length) {
        console.log('Too few arguments');
        usage();
        process.exit(1);
    }
    return args[i];
}

function parseArgs() {
    var args = process.argv.slice(2);
    var i = 0;
    while (i < args.length) {
        switch (args[i]) {
            case '-h':
            case '--help':
                usage();
                process.exit(0);
                break;
            case '-r':
            case '--region':
                region = getArgOrExit(++i, args)
                break;
            case '-u':
            case '--use-chime-sdk-meetings':
                useChimeSDKMeetings = getArgOrExit(++i, args)
                break;
            case '-b':
            case '--s3-bucket':
                bucket = getArgOrExit(++i, args)
                break;
            case '-s':
            case '--stack-name':
                stack = getArgOrExit(++i, args)
                break;
            case '-a':
            case '--application':
                app = getArgOrExit(++i, args)
                break;
            case '-e':
            case '--event-bridge':
                useEventBridge = true;
                break;
            case '-c':
            case '--chime-endpoint':
                chimeEndpoint = getArgOrExit(++i, args)
                break;
            case '-p':
            case '--service-principal':
                chimeMediaPipelinesServicePrincipal = getArgOrExit(++i, args)
                break;
            case '-t':
            case '--enable-termination-protection':
                enableTerminationProtection = true;
                break;
            case '-l':
            case '--disable-printing-logs':
                disablePrintingLogs = true;
                break;
            case '-o':
            case '--capture-output-prefix':
                captureOutputPrefix = getArgOrExit(++i, args);
                break;
            case '-i':
            case '--opt-in-regions':
                optInRegions = getArgOrExit(++i, args);
                mediaCaptureRegions = mediaCaptureRegions.concat(optInRegions.split(','));
                break;
            case '-m':
            case '--chime-sdk-meetings-endpoint':
                chimeSDKMeetingsEndpoint = getArgOrExit(++i, args)
                break;
            case '--chime-sdk-media-pipelines-endpoint':
                chimeSDKMediaPipelinesEndpoint = getArgOrExit(++i, args);
                break;
            case '--use-chime-sdk-media-pipelines':
                useChimeSDKMediaPipelines = getArgOrExit(++i, args);
                break;
            case '--chime-sdk-media-pipelines-region':
                mediaPipelinesControlRegion = getArgOrExit(++i, args);
                break;
            case '--ivs-channel-prefix':
                ivsChannelPrefix = getArgOrExit(++i, args);
                break;
            default:
                console.log(`Invalid argument ${args[i]}`);
                usage();
                process.exit(1)
        }
        ++i;
    }

    if (app === 'meeting') {
        app = 'meetingV2';
    }

    if (!stack.trim() || !bucket.trim()) {
        console.log('Missing required parameters');
        usage();
        process.exit(1);
    }
}

function spawnOrFail(command, args, options, printOutput = true) {
    options = {
        ...options,
        shell: true
    };
    const cmd = spawnSync(command, args, options);
    if (cmd.error) {
        console.log(`Command ${command} failed with ${cmd.error.code}`);
        process.exit(255);
    }
    const output = cmd.stdout.toString();
    if (printOutput) {
        console.log(output);
    }
    if (cmd.status !== 0) {
        console.log(`Command ${command} failed with exit code ${cmd.status} signal ${cmd.signal}`);
        console.log(cmd.stderr.toString());
        process.exit(cmd.status)
    }
    return output;
}

function appHtml(appName) {
    return `../browser/dist/${appName}.html`
}

function ensureApp(appName) {
    console.log(`Verifying application ${appName}`);
    if (!fs.existsSync(`../browser/app/${appName}`)) {
        console.log(`Application ${appName} does not exist. Did you specify correct name?`);
        process.exit(1);
    }
    console.log(`Rebuilding demo app`);
    spawnOrFail('npm', ['run', 'build', `--app=${appName}`], {cwd: path.join(__dirname, '..', 'browser')});
}

function ensureTools() {
    spawnOrFail('aws', ['--version']);
    spawnOrFail('sam', ['--version']);

    spawnOrFail('npm', ['install']);
}

function createCaptureS3Buckets(bucketPrefix, regions) {
    console.log(`Creating S3 buckets for media capture pipelines artifacts.  Bucket prefix: ${bucketPrefix} Regions:[${regions}]`);
    const lifecycleConfiguration = JSON.stringify({
        "Rules": [{
            "ID": "Delete artifacts after 1 day",
            "Expiration": {"Days": 1},
            "Status": "Enabled",
            "Prefix": "",
        }]
    });
    fs.writeFileSync('build/lifecycle_configuration.json', lifecycleConfiguration, {encoding: 'utf8', flag: 'w'});
    for (bucketRegion of regions) {
        const bucketName = `${bucketPrefix}-${bucketRegion}`;
        const bucketPolicy = JSON.stringify({
            "Id": "Policy1625687208360",
            "Version": "2012-10-17",
            "Statement": [{
                "Sid": "Stmt1625687206729",
                "Action": [
                    "s3:PutObject",
                    "s3:PutObjectAcl"
                ],
                "Effect": "Allow",
                "Resource": `arn:aws:s3:::${bucketName}/*`,
                "Principal": {
                    "Service": [
                        chimeMediaPipelinesServicePrincipal
                    ]
                }
            }]
        });

        fs.writeFileSync('build/bucket_policy.json', bucketPolicy, {encoding: 'utf8', flag: 'w'});

        const s3Api = spawnSync('aws', ['s3api', 'head-bucket', '--bucket', `${bucketName}`, '--region', `${bucketRegion}`]);
        if (s3Api.status !== 0) {
            if (bucketRegion === 'us-east-1') {
                spawnOrFail('aws', ['s3api', 'create-bucket', '--bucket', bucketName, '--region', bucketRegion], null, !disablePrintingLogs);
            } else {
                spawnOrFail('aws', ['s3api', 'create-bucket', '--bucket', bucketName, '--region', bucketRegion, '--create-bucket-configuration', `LocationConstraint=${bucketRegion}`], null, !disablePrintingLogs);
            }
            spawnOrFail('aws', ['s3api', 'put-bucket-policy', '--bucket', bucketName, '--region', bucketRegion, '--policy', 'file://build/bucket_policy.json']);
            spawnOrFail('aws', ['s3api', 'put-bucket-lifecycle-configuration', '--bucket', bucketName, '--region', bucketRegion, '--lifecycle-configuration', 'file://build/lifecycle_configuration.json']);
        }
    }
}


// async function createIVSChannel(ivsChannelPrefix, parameterOverrides) {
//     console.log(`Creating IVS Channel for media live connector pipelines. IVS channel prefix : ${ivsChannelPrefix}, region : ${region}`);
//     const ivsChannelName = `${ivsChannelPrefix}-${region}`;
//     ivsEndpoint = ''
//     rtmpURL = ''
//     ivsPlaybackUrl = ''
//     ivs.createChannel(
//         {name: ivsChannelName},
//         function (err, ivsCreateChannelResponse) {
//             if (err)
//                 console.log("when creating IVS, error is " + err, err.stack); // an error occurred when creating IVS channel
//             else
//                 ivsPlaybackUrl = ivsCreateChannelResponse.channel.playbackUrl
//             ivsEndpoint = ivsCreateChannelResponse.channel.ingestEndpoint
//             ivsStreamKey = ivsCreateChannelResponse.streamKey.value
//             rtmpURL = "rtmps://" + ivsEndpoint + "443/app/" + ivsStreamKey
//             console.log(`before IVS channel ${ivsChannelName} successfully created. Playback url is ${ivsPlaybackUrl}, rtmpURL is ${rtmpURL}`);
//             parameterOverrides += ` IVSChannelPlaybackUrl=${ivsPlaybackUrl}`;
//             parameterOverrides += ` RtmpUrl=${rtmpURL}`;
//             console.log(`in createIVSChannel, parameterOverrides is ${parameterOverrides}`)
//         })
//     return [ivsPlaybackUrl, rtmpURL]
// }

function copyAssets() {
    fs.copySync('../browser/dist/speech.mp3', 'src/speech.mp3');
    fs.copySync('../browser/dist/speech_stereo.mp3', 'src/speech_stereo.mp3');
}

function ensureRegion() {
    if (useChimeSDKMeetings === 'true') {
        if (!(new Set(supportedControlRegions)).has(region)) {
            console.error(`Amazon Chime SDK does not support ${region} (control region). Specify one of the following regions: ${supportedControlRegions.join(', ')}.\nSee https://docs.aws.amazon.com/chime/latest/dg/sdk-available-regions.html for more information.`);
            process.exit(1);
        }
    }
}

function ensureMediaPipelinesRegion() {
    if (useChimeSDKMediaPipelines === 'true' && !(new Set(supportedMediaPipelinesControlRegions)).has(region)) {
        console.error(`Amazon Chime SDK Media Pipelines does not support ${region} (control region). Specify one of the following regions: ${supportedMediaPipelinesControlRegions.join(', ')}.\nSee https://docs.aws.amazon.com/chime-sdk/latest/dg/sdk-available-regions.html#sdk-media-pipelines for more information.`);
        process.exit(1);
    }
}

async function startDeployment() {
    parseArgs();
    ensureRegion();
    ensureMediaPipelinesRegion();
    ensureTools();
    ensureApp(app);

    if (!fs.existsSync('build')) {
        fs.mkdirSync('build');
    }

    console.log(`Using region ${region}, useChimeSDKMeetings ${useChimeSDKMeetings}, bucket ${bucket}, stack ${stack}, endpoint ${chimeEndpoint}, enable-termination-protection ${enableTerminationProtection}, disable-printing-logs ${disablePrintingLogs} service-principal ${chimeMediaPipelinesServicePrincipal}`);
    ensureBucket();

    copyAssets();
    fs.copySync(appHtml(app), 'src/index.html');
    spawnOrFail('npm', ['install'], {cwd: path.join(__dirname, 'src')});
    spawnOrFail('sam', ['package', '--s3-bucket', `${bucket}`,
        `--output-template-file`, `build/packaged.yaml`,
        '--region', `${region}`]);
    console.log('Deploying serverless application');
    let parameterOverrides = `Region=${region} UseChimeSDKMeetings=${useChimeSDKMeetings} UseEventBridge=${useEventBridge} ChimeEndpoint=${chimeEndpoint} ChimeServicePrincipal=${chimeMediaPipelinesServicePrincipal} ChimeSDKMeetingsEndpoint=${chimeSDKMeetingsEndpoint} ChimeSDKMediaPipelinesEndpoint=${chimeSDKMediaPipelinesEndpoint} UseChimeSDKMediaPipelines=${useChimeSDKMediaPipelines} MediaPipelinesControlRegion=${mediaPipelinesControlRegion}`
    if (app === 'meetingV2' && captureOutputPrefix) {
        parameterOverrides += ` ChimeMediaCaptureS3BucketPrefix=${captureOutputPrefix}`;
        createCaptureS3Buckets(captureOutputPrefix, mediaCaptureRegions);
    } else if (app === 'meetingV2' && ivsChannelPrefix) {
        parameterOverrides += ` IVSChannelPrefix=${ivsChannelPrefix}`;
        const ivsChannelName = `${ivsChannelPrefix}-${region}`;
        ivsEndpoint = ''
        rtmpURL = ''
        ivsPlaybackUrl = ''
        await ivs.createChannel(
            {name: ivsChannelName},
            function (err, ivsCreateChannelResponse) {
                if (err)
                    console.log("when creating IVS, error is " + err, err.stack); // an error occurred when creating IVS channel
                else
                    ivsPlaybackUrl = ivsCreateChannelResponse.channel.playbackUrl
                ivsEndpoint = ivsCreateChannelResponse.channel.ingestEndpoint
                ivsStreamKey = ivsCreateChannelResponse.streamKey.value
                rtmpURL = "rtmps://" + ivsEndpoint + "443/app/" + ivsStreamKey
                console.log(`before IVS channel ${ivsChannelName} successfully created. Playback url is ${ivsPlaybackUrl}, rtmpURL is ${rtmpURL}`);
                parameterOverrides += ` IVSChannelPlaybackUrl=${ivsPlaybackUrl}`;
                parameterOverrides += ` RtmpUrl=${rtmpURL}`;
                console.log(`in createIVSChannel, parameterOverrides is ${parameterOverrides}`)
            }).promise()
        parameterOverrides += ` IVSChannelPrefix=${ivsChannelPrefix}`;
    } else if (app === 'messagingSession') {
        parameterOverrides += ` UseFetchCredentialLambda=true`
    }
    spawnOrFail('sam', ['deploy', '--template-file', './build/packaged.yaml', '--stack-name', `${stack}`,
        '--parameter-overrides', parameterOverrides,
        '--capabilities', 'CAPABILITY_IAM', '--region', `${region}`, '--no-fail-on-empty-changeset'], null, !disablePrintingLogs);
    if (enableTerminationProtection) {
        spawnOrFail('aws', ['cloudformation', 'update-termination-protection', '--enable-termination-protection', '--stack-name', `${stack}`, '--region', `${region}`], null, false);
    }
    if (!disablePrintingLogs) {
        console.log('Amazon Chime SDK Meeting Demo URL: ');
    }
    const output = spawnOrFail('aws', ['cloudformation', 'describe-stacks', '--stack-name', `${stack}`,
        '--query', 'Stacks[0].Outputs[0].OutputValue', '--output', 'text', '--region', `${region}`], null, !disablePrintingLogs);
}

startDeployment()