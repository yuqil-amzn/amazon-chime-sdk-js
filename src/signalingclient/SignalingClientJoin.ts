// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ApplicationMetadata from '../applicationmetadata/ApplicationMetadata';

/**
 * [[SignalingClientJoin]] contains settings for the Join SignalFrame.
 */
export default class SignalingClientJoin {
  wantsServerSideNetworkProbingOnReceiveSideEstimator: boolean = false;
  wantsServerSideNetworkAdaption: boolean = false;

  /**
   * Initializes a SignalingClientJoin with the given properties.
   * @param applicationMetadata [[ApplicationMetadata]].
   */
  constructor(public readonly applicationMetadata?: ApplicationMetadata) {}
}
