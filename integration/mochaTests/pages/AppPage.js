const {By, Key, until} = require('selenium-webdriver');
// const {TestUtils} = require('kite-common');
const {performance} = require('perf_hooks');

let elements;

function findAllElements() {
  // These will be stale after a reload.
  elements = {
    meetingIdInput: By.id('inputMeeting'),
    attendeeNameInput: By.id('inputName'),
    authenticateButton: By.id('authenticate'),
    joinButton: By.id('joinButton'),
    meetingEndButtom: By.id('button-meeting-end'),
    meetingLeaveButton: By.id('button-meeting-leave'),
    roster: By.id('roster'),
    participants: By.css('li'),
    
    authenticationFlow: By.id('flow-authenticate'),
    deviceFlow: By.id('flow-devices'),
    meetingFlow: By.id('flow-meeting'),
    

    microphoneDropDownButton: By.id('button-microphone-drop'),
    microphoneButton: By.id('button-microphone'),
    microphoneDropDown: By.id('dropdown-menu-microphone'),
    microphoneDropDown440HzButton: By.id('dropdown-menu-microphone-440-Hz'),
  };
}

findAllElements();

const SessionStatus = {
  STARTED: 'Started',
  FAILED: 'Failed',
  CONNECTING: 'Connecting',
};

class AppPage {
  constructor(driver) {
    this.driver = driver;
  }

  configureLogger(logger) {
    this.logger = logger;
  }

  findAllElements() {
    findAllElements();
  }

  async open(url) {
    await this.driver.get(url);
    await this.waitForBrowserDemoToLoad();
  }

  async waitForBrowserDemoToLoad()  {
    await this.driver.wait(until.elementIsVisible(this.driver.findElement(elements.authenticationFlow)));
  }

  async close(stepInfo) {
    await stepInfo.driver.close();
  }

  async enterMeetingId(meetingId) {
    let meetingIdInputBox = await this.driver.findElement(elements.meetingIdInput);
    await meetingIdInputBox.clear();
    await meetingIdInputBox.sendKeys(meetingId);
  }

  async enterAttendeeName(attendeeName) {
    let attendeeNameInputBox = await this.driver.findElement(elements.attendeeNameInput);
    await attendeeNameInputBox.clear();
    await attendeeNameInputBox.sendKeys(attendeeName);
  }

  async selectRegion(region) {
    await this.driver.findElement(By.css(`option[value=${region}]`)).click();
  }

  async authenticate() {
    let authenticateButton = await this.driver.findElement(elements.authenticateButton);
    await authenticateButton.click();
    await this.waitForUserAuthentication();
  }

  async waitForUserAuthentication() {
    await this.driver.wait(until.elementIsVisible(this.driver.findElement(elements.joinButton)));
  }

  async joinMeeting() {
    let joinButton = await this.driver.findElement(elements.joinButton);
    await joinButton.click();
    await this.waitForUserJoin();
  }

  async waitForUserJoin() {
    await this.driver.wait(until.elementIsVisible(this.driver.findElement(elements.meetingFlow)));
  }

  // async endTheMeeting() {
  //   let meetingEndButtom = await this.driver.findElement(elements.meetingEndButtom);
  //   await meetingEndButtom.click();
  // }

  // async leaveTheMeeting() {
  //   let meetingLeaveButton = await this.driver.findElement(elements.meetingLeaveButton);
  //   await meetingLeaveButton.click();
  // }

  async clickMicrophoneButton() {
    let microphoneButton = await this.driver.findElement(elements.microphoneButton);
    await this.driver.wait(until.elementIsVisible(microphoneButton));
    await microphoneButton.click();
  }

  async checkMicrophoneStatus() {

  }

  async muteMicrophone()  {
    await this.clickMicrophoneButton();
    // await this.driver.wait(until.elementIsDisabled(this.driver.findElement(elements.microphoneButton)));
  }

  async getNumberOfParticipants() {
    const roster = await this.driver.findElement(elements.roster);
    const participantElements = await this.driver.findElements(elements.participants);
    // this.logger(`Number of participants on roster: ${participantElements.length}`);
    return participantElements.length;
  }

  async rosterCheck(numberOfParticipant = 1)  {
    await this.driver.wait(async () => {
      return await this.getNumberOfParticipants() == numberOfParticipant;
    }, 5000);
  }

  async clickOnMicrophoneDropdownButton() {
    let microphoneDropDownButton = await this.driver.findElement(elements.microphoneDropDownButton);
    await this.driver.wait(until.elementIsVisible(microphoneDropDownButton));
    await microphoneDropDownButton.click();
    await this.driver.wait(until.elementIsVisible(this.driver.findElement(elements.microphoneDropDown)));
  }

  async playRandomTone()  {
    this.muteMicrophone();
    this.clickOnMicrophoneDropdownButton();
    let microphoneDropDown440HzButton = await this.driver.findElement(elements.microphoneDropDown440HzButton);
    await this.driver.wait(until.elementIsVisible(microphoneDropDown440HzButton));
    await microphoneDropDown440HzButton.click();
  }

  async stopPlayingRandomTone()  {
    this.muteMicrophone();
    // this.clickOnMicrophoneDropdownButton();
    // let microphoneDropDown440HzButton = await this.driver.findElement(elements.microphoneDropDown440HzButton);
    // await this.driver.wait(until.elementIsVisible(microphoneDropDown440HzButton));
    // await microphoneDropDown440HzButton.click();
  }

  
  async audioCheck(expectedState, checkStereoTones = false) {
    let res = undefined;
    try {
      res = await this.driver.executeAsyncScript(async (expectedState, checkStereoTones) => {
        let logs = [];
        let callback = arguments[arguments.length - 1];

        const sleep = (milliseconds) => {
          return new Promise(resolve => setTimeout(resolve, milliseconds))
        };

        const channelCount = checkStereoTones ? 2 : 1;

        const successfulToneChecks = Array(channelCount).fill(0);
        const totalToneChecks = Array(channelCount).fill(0);
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const minToneError = Array(channelCount).fill(Infinity);
        const maxToneError = Array(channelCount).fill(-Infinity);
        const percentages = Array(channelCount).fill(0);
        try {
          const stream = document.getElementById('meeting-audio').srcObject;
          const source = audioContext.createMediaStreamSource(stream);
          let analyser = [];
          for(let i=0; i<channelCount; i++) {
            analyser.push(audioContext.createAnalyser());
          }
          let byteFrequencyData = [];
          for(let i=0; i<channelCount; i++) {
            byteFrequencyData.push(new Uint8Array(analyser[i].frequencyBinCount));
          }
          let floatFrequencyData = [];
          for(let i=0; i<channelCount; i++) {
            floatFrequencyData.push(new Float32Array(analyser[i].frequencyBinCount));
          }

          if (checkStereoTones) {
            const splitterNode = audioContext.createChannelSplitter(2);
            source.connect(splitterNode);
            splitterNode.connect(analyser[0], 0);
            splitterNode.connect(analyser[1], 1);
          } else {
            source.connect(analyser[0]);
          }

          await sleep(5000);

          const getAverageVolume = (channelIndex) => {
            analyser[channelIndex].getByteFrequencyData(byteFrequencyData[channelIndex]);
            let values = 0;
            let average;
            const length = byteFrequencyData[channelIndex].length;
            // get all the frequency amplitudes
            for (let i = 0; i < length; i++) {
              values += byteFrequencyData[channelIndex][i];
            }
            average = values / length;
            return average;
          };

          const checkVolumeFor = async (runCount, channelIndex) => {
            for (let i = 0; i < runCount; i++) {
              totalToneChecks[channelIndex]++;
              const avgTestVolume = getAverageVolume(channelIndex);
              logs.push(`Resulting volume of ${avgTestVolume}`);
              if (
                (expectedState === "AUDIO_ON" && avgTestVolume > 0) ||
                (expectedState === "AUDIO_OFF" && avgTestVolume === 0)
              ) {
                successfulToneChecks[channelIndex]++;
              }
              await sleep(100)
            }
          };

          const checkFrequency = (targetReceiveFrequency, channelIndex) => {
            analyser[channelIndex].getFloatFrequencyData(floatFrequencyData[channelIndex]);
            // logs.push(`frequency data : ${floatFrequencyData}`);
            let maxBinDb = -Infinity;
            let hotBinFrequency = 0;
            const binSize = audioContext.sampleRate / analyser[channelIndex].fftSize; // default fftSize is 2048
            for (let i = 0; i < floatFrequencyData[channelIndex].length; i++) {
              const v = floatFrequencyData[channelIndex][i];
              if (v > maxBinDb) {
                maxBinDb = v;
                hotBinFrequency = i * binSize;
              }
            }
            const error = Math.abs(hotBinFrequency - targetReceiveFrequency);
            if (maxBinDb > -Infinity) {
              if (error < minToneError[channelIndex]) {
                minToneError[channelIndex] = error;
              }
              if (error > maxToneError[channelIndex]) {
                maxToneError[channelIndex] = error;
              }
            }
            if (error <= 2 * binSize) {
              successfulToneChecks[channelIndex]++;
            }
            totalToneChecks[channelIndex]++;
            return hotBinFrequency
          };

          const checkFrequencyFor = async (runCount, freq, channelIndex) => {
            for (let i = 0; i < runCount; i++) {
              const testFrequency = checkFrequency(freq, channelIndex);
              logs.push(`Resulting Frequency of ${testFrequency} for channel ${channelIndex}`);
              await sleep(100)
            }
          };

          if (expectedState === "AUDIO_OFF") {
            await checkVolumeFor(50, 0);
            if (checkStereoTones) {
              await checkVolumeFor(50, 1);
            }
          }

          if (expectedState === "AUDIO_ON") {
            if (checkStereoTones) {
              await checkFrequencyFor(50, 500, 0);
              await checkFrequencyFor(50, 1000, 1);
            } else {
              await checkFrequencyFor(50, 440, 0);
            }
          }

          for (let i=0; i<channelCount; i++) {
            percentages[i] = successfulToneChecks[i] / totalToneChecks[i];
          }
        } catch (e) {
          logs.push(`${e}`)
        } finally {
          logs.push(`Audio check completed`);
          await audioContext.close();
          callback({
            percentages,
            logs
          });
        }
      }, expectedState, checkStereoTones);
    } catch (e) {
      console.log(`Audio check failed ${e}`)
    } finally {
      if (res) {
        res.logs.forEach(l => {
          console.log(l)
        })
      }
    }
    if (!res) {
      return false;
    }
    for (let i=0; i<res.percentages.length; i++) {
      console.log(`Audio check success rate channel ${i}: ${res.percentages[i] * 100}%`);
      if (res.percentages[i] < 0.75) {
        return false;
      }
    }
    return true;
  }
}


module.exports = AppPage;
