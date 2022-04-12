// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[ServerSideNetworkAdaption]] represents additional server side features that can be enabled for network adaption.
 */
export enum ServerSideNetworkAdaption {
  /**
   * No features enabled.
   */
  None,

  /**
   * Disable the existing client side bandwidth probing methods of waiting and unpausing, or waiting and upgrading simulcast streams 
   * (which can be large increases of bitrates which may lead to periodic oversubscription over network capacity
   * and resulting video freezes) and replace it with more gradual server side probing of increasing amounts padding packets until
   * the bandwidth estimate safely reaches the value needed to resume the next video source, or upgrade to the next higher simulcast stream.
   * 
   * When this is enabled, any policy 'probing' for bandwidth headroom
   * should be disabled. This may also enable pacing of some media packets from the server
   * side, and may also enable packet burst probing.
   * 
   * End users should overall see reduced video freezes, reduced broken audio, and reduced packet loss.
   */
  EnableBandwidthProbing,

  /**
   * Note: The following value is experimental and should not be used for production workloads
   * until indicated. The value impacts response to network events and may lead to unnecessary
   * remote video pauses/downgrades that did not occur before. The behavior of this value may
   * change in future releases.
   * 
   * Disable internal policy behavior and proxy priorities to server to automatically
   * switch, pause, or resume streams based on server calculated network constraints. This will
   * significantly improve response times when network constraints occur. This will also support the
   * features covered in `EnableBandwidthProbing` though possibly with different implementation details.
   * 
   * End users should overall see reduced video freezes, reduced broken audio, and reduced packet loss.
   */
  EnableBandwidthProbingAndRemoteVideoQualityAdaption,
}

export default ServerSideNetworkAdaption;
