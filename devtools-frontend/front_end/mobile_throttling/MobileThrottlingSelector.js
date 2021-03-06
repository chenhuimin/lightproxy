// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {Events, throttlingManager} from './ThrottlingManager.js';
import {advancedMobilePresets, CustomConditions, mobilePresets, NoThrottlingConditions,} from './ThrottlingPresets.js';

export class MobileThrottlingSelector {
  /**
   * @param {function(!Array<!MobileThrottling.MobileThrottlingConditionsGroup>):!MobileThrottling.ConditionsList} populateCallback
   * @param {function(number)} selectCallback
   */
  constructor(populateCallback, selectCallback) {
    this._populateCallback = populateCallback;
    this._selectCallback = selectCallback;
    throttlingManager().addEventListener(Events.RateChanged, this._conditionsChanged, this);
    SDK.multitargetNetworkManager.addEventListener(
        SDK.MultitargetNetworkManager.Events.ConditionsChanged, this._conditionsChanged, this);
    /** @type {!MobileThrottling.ConditionsList} */
    this._options = this._populateOptions();
    this._conditionsChanged();
  }

  /**
   * @param {!MobileThrottling.Conditions} conditions
   */
  optionSelected(conditions) {
    SDK.multitargetNetworkManager.setNetworkConditions(conditions.network);
    throttlingManager().setCPUThrottlingRate(conditions.cpuThrottlingRate);
  }

  /**
   * @return {!MobileThrottling.ConditionsList}
   */
  _populateOptions() {
    const disabledGroup = {title: Common.UIString('Disabled'), items: [NoThrottlingConditions]};
    const presetsGroup = {title: Common.UIString('Presets'), items: mobilePresets};
    const advancedGroup = {title: Common.UIString('Advanced'), items: advancedMobilePresets};
    return this._populateCallback([disabledGroup, presetsGroup, advancedGroup]);
  }

  _conditionsChanged() {
    const networkConditions = SDK.multitargetNetworkManager.networkConditions();
    const cpuThrottlingRate = throttlingManager().cpuThrottlingRate();
    for (let index = 0; index < this._options.length; ++index) {
      const option = this._options[index];
      if (option && option.network === networkConditions && option.cpuThrottlingRate === cpuThrottlingRate) {
        this._selectCallback(index);
        return;
      }
    }
    this._selectCallback(this._options.indexOf(CustomConditions));
  }
}
