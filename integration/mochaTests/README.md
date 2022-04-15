# Mocha Tests

Currently, integration tests are being transitioned over from KITE to Mocha. Since, the KITE tests require a separate config it is stored in `MochaTests`.

## Test JSON Config Schema

```json
{
   "tests": [
     {
      /**
        Name of the test
        @type String
        @required
      */
      "name": "TestName",
      /* 
        Test implementation value is the name of the JS test file which includes the Mocha / Selenium test.

        Some tests might use a different test file even if they are testing the same feature.
        @type String
        @required
      */
      "testImpl": "TestImpl.js",
      /* 
        Use Stereo Music Audio Profile
        @type boolean
        @optional
      */
      "useStereoMusicAudioProfile": true,
      /* 
        Generate Stereo Tones
        @type boolean
        @optional
      */
      "generateStereoTones": true,
      /* 
        Selenium sessions

        @type JSON Object
        @optional
      */
      "seleniumSessions": {
        "safari": 2,
        "ANDROID": 2
      },
      // Test timeout
      "timeout": 120,
      "canaryLogPath": "./logs"
     }
     
   ],
   "clients": [
     {
        /* 
          Browser name
          @type string
          @required
        */ 
        "browserName": "chrome",
        /* 
          Browser Version
          @type string
          @required
        */
        "browserVersion": "latest",
        /* 
          Platform
          @type string
          @required        
        */
        "platform": "MAC"
     }
   ]
}
```